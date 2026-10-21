import * as fs from 'node:fs'
import {Readable, Writable} from 'node:stream'
import {pipeline} from 'node:stream/promises'
import * as zlib from 'node:zlib'

import {Command, Flags} from '@oclif/core'
import {confirm} from '@inquirer/prompts'

import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

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
  // a tar that dies partway ends the download early, and whatever arrived is not an
  // archive. the gzip stream carries a checksum and a length at its end, so reading it
  // through (to nowhere) tells whether the download is whole
  private async assertCompleteArchive(buffer: Buffer): Promise<void> {
    const discard = new Writable({
      write(_chunk, _encoding, callback) {
        callback()
      },
    })
    try {
      await pipeline(Readable.from([buffer]), zlib.createGunzip(), discard)
    } catch (error) {
      this.error(`The downloaded archive is not complete (${(error as Error).message}). Nothing was written.`)
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
    const res = await request({method: 'GET', url, discoConfig})

    // get binary data from response; the daemon ends the download early when tar fails
    let buffer: Buffer
    try {
      buffer = Buffer.from(await res.arrayBuffer())
    } catch (error) {
      this.error(`The download ended before the archive was complete (${(error as Error).message}). Nothing was written.`)
    }

    await this.assertCompleteArchive(buffer)

    // Handle output to file if specified
    if (flags.output) {
      fs.writeFileSync(flags.output, buffer)
      this.log(`Volume exported to ${flags.output}`)
      return
    }

    // If in TTY and not forced, ask for confirmation
    if (process.stdout.isTTY && !flags.force) {
      this.log('Warning: You are about to output binary data to your terminal.')
      this.log('This may cause unexpected behavior or corrupt your terminal session.')
      this.log('Consider using redirection (> volume.tar.gz) or the --output flag instead.')

      const confirmed = await this.confirmAction()
      if (!confirmed) {
        this.log('Export cancelled.')
        return
      }
    }

    // Write binary data to stdout
    process.stdout.write(buffer)
  }
}
