import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import {Readable} from 'node:stream'
import {pipeline} from 'node:stream/promises'

import {Command, Flags} from '@oclif/core'
import {confirm} from '@inquirer/prompts'

import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'
import {BadArchive, copyVerified} from '../../tar-gz.js'

export const net = {request}

export default class VolumesExport extends Command {
  static override description = 'export a volume'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --project=myproject --volume=myvolume',
    '<%= config.bin %> <%= command.id %> --project=myproject --volume=myvolume > volume.tar.gz',
    '<%= config.bin %> <%= command.id %> --project=myproject --volume=myvolume --force',
  ]

  static override flags = {
    project: Flags.string({required: true, description: 'project ID'}),
    disco: Flags.string({required: false, description: 'disco configuration to use'}),
    volume: Flags.string({required: true, description: 'volume ID to export'}),
    force: Flags.boolean({
      description: 'force output to terminal without confirmation',
      default: false,
    }),
    output: Flags.string({
      description: 'output file path (instead of stdout)',
      required: false,
    }),
  }

  // the daemon streams tar's output and cannot change the status once it has started:
  // a tar that dies partway ends the download early, and whatever arrived is not an archive
  private async downloadVerified(body: Readable, tmpPath: string): Promise<void> {
    try {
      await copyVerified(body, fs.createWriteStream(tmpPath))
    } catch (error) {
      fs.rmSync(tmpPath, {force: true})
      if (error instanceof BadArchive) {
        this.error(`The downloaded archive is not complete (${error.message}). Nothing was written.`)
      }

      this.error(`The download ended before the archive was complete (${(error as Error).message}). Nothing was written.`)
    }
  }

  private async confirmAction(): Promise<boolean> {
    return confirm({
      message: 'Binary data will be output to your terminal. Continue?',
      default: false,
    })
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(VolumesExport)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/${flags.project}/volumes/${flags.volume}`
    const res = await net.request({method: 'GET', url, discoConfig})
    if (!res.body) {
      this.error('The daemon sent no body')
    }

    const body = res.body as unknown as Readable

    // Handle output to file if specified
    if (flags.output) {
      const tmpPath = `${flags.output}.part`
      await this.downloadVerified(body, tmpPath)
      fs.renameSync(tmpPath, flags.output)
      this.log(`Volume exported to ${flags.output}`)
      return
    }

    const tmpPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'disco-volume-')), 'volume.tar.gz')
    await this.downloadVerified(body, tmpPath)

    // If in TTY and not forced, ask for confirmation
    if (process.stdout.isTTY && !flags.force) {
      this.log('Warning: You are about to output binary data to your terminal.')
      this.log('This may cause unexpected behavior or corrupt your terminal session.')
      this.log('Consider using redirection (> volume.tar.gz) or the --output flag instead.')

      const confirmed = await this.confirmAction()
      if (!confirmed) {
        fs.rmSync(tmpPath, {force: true})
        this.log('Export cancelled.')
        return
      }
    }

    // Write the verified archive to stdout
    await pipeline(fs.createReadStream(tmpPath), process.stdout, {end: false})
    fs.rmSync(tmpPath, {force: true})
  }
}
