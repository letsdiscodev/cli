import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {Readable, Writable} from 'node:stream'

import {Command, Flags} from '@oclif/core'

import {request} from '../../auth-request.js'
import {getDisco} from '../../config.js'
import {BadArchive, copyVerified, devNull} from '../../tar-gz.js'

export const net = {request}

export default class VolumesImport extends Command {
  static override description = 'import a volume'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --project=myproject --volume=myvolume --input volume.tar.gz',
    '<%= config.bin %> <%= command.id %> --project=myproject --volume=myvolume < volume.tar.gz',
  ]

  static override flags = {
    disco: Flags.string({required: false, description: 'disco configuration to use'}),
    input: Flags.string({required: false, description: 'input file path (instead of stdin)'}),
    project: Flags.string({required: true, description: 'project ID'}),
    volume: Flags.string({required: true, description: 'volume ID to import into'}),
  }

  private async verify(source: Readable, sink: Writable, what: string): Promise<void> {
    try {
      await copyVerified(source, sink)
    } catch (error) {
      if (error instanceof BadArchive) {
        this.error(`${what} is not a tar.gz volume export (${error.message})`)
      }

      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.error(`File not found: ${what}`)
      }

      this.error(`Error reading from ${what}: ${(error as Error).message}`)
    }
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(VolumesImport)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/${flags.project}/volumes/${flags.volume}`

    // the daemon deletes the volume before unpacking what we send, so a bad archive has to be
    // caught here. stdin is spooled to a temp file, verified as it is written, and uploaded from
    // there. that also gives every upload a content-length, which some tunnels need: cloudflare's,
    // in front of a raspberry pi, cut off uploads that streamed without one
    let file: string
    let tmpDir: string | undefined
    if (flags.input) {
      file = path.resolve(flags.input)
      await this.verify(fs.createReadStream(file), devNull(), `"${flags.input}"`)
    } else if (process.stdin.isTTY) {
      this.error('No input provided. Please provide an input file with --input or pipe data to stdin')
    } else {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'disco-volume-import-'))
      file = path.join(tmpDir, 'volume.tar.gz')
    }

    try {
      if (tmpDir) {
        await this.verify(process.stdin, fs.createWriteStream(file), 'stdin')
      }

      const extraHeaders = {'Content-Length': fs.statSync(file).size.toString()}
      const res = await net.request({method: 'PUT', url, discoConfig, bodyStream: fs.createReadStream(file), extraHeaders})
      await res.json()
    } finally {
      if (tmpDir) fs.rmSync(tmpDir, {force: true, recursive: true})
    }
  }
}
