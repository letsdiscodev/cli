import fs from 'node:fs'
import path from 'node:path'
import {Readable} from 'node:stream'

import {Command, Flags} from '@oclif/core'

import {request} from '../../auth-request.js'
import {getDisco} from '../../config.js'

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
    volume: Flags.string({required: true, description: 'volume ID to export'}),
  }

  private getFileStream(filepath: string): Readable {
    try {
      const filePath = path.resolve(filepath)
      const fileStats = fs.statSync(filePath)

      if (!fileStats.isFile()) {
        this.error(`"${filepath}" is not a file`)
      }

      return fs.createReadStream(filePath)
    } catch (error: unknown) {
      if (error instanceof Error) {
        if ('code' in error && error.code === 'ENOENT') {
          this.error(`File not found: "${filepath}"`)
        } else {
          this.error(`Error accessing "${filepath}": ${error.message}`)
        }
      } else {
        this.error(`Unkown error occurred while accessing file`)
      }
    }
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(VolumesImport)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/${flags.project}/volumes/${flags.volume}`

    let stream: Readable = process.stdin
    stream.on('error', (err) => {
      this.error(`Error reading from stdin: ${err.message}`)
    })

    const extraHeaders: Record<string, string> = {}

    if (flags.input) {
      // if we are given the file, get its actual file size, and then
      // we'll pass it as a content-length header.
      // incredibly... this is the volumes to run volumes:import for raspberry pis
      // that use the cloudflare tunnel... we've seen consistently that the tunnel would...
      // cut off? or somehow not let the stream'ed file through... and when we forced a content-length
      // header, that problem went away.... so ... if you use a raspberry pi and a cloudflare tunnel,
      // (and are somehow reading this comment), the solution is to NOT pipe .tar.gz volumes into
      // disco volumes:import, but rather run volumes:import with the --input option...
      // obviously, this is not ideal. but it is! what it is!

      extraHeaders['Content-Length'] = fs.statSync(flags.input).size.toString()

      stream = this.getFileStream(flags.input)
      stream.on('error', (err) => {
        this.error(`Error reading from "${flags.input}": ${err.message}`)
      })
    } else if (process.stdin.isTTY) {
      this.error('No input provided. Please provide an input file with --input or pipe data to stdin')
    }

    const res = await request({method: 'PUT', url, discoConfig, bodyStream: stream, extraHeaders})
    await res.json()
  }
}
