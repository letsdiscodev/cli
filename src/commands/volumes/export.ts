import * as fs from 'node:fs'

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

    // get binary data from response
    const data = await res.arrayBuffer()
    const buffer = Buffer.from(data)

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
