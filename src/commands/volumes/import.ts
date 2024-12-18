import {Command, Flags} from '@oclif/core'

import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export default class VolumesImport extends Command {
  static override description = 'import a volume'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  static override flags = {
    project: Flags.string({required: true}),
    disco: Flags.string({required: false}),
    volume: Flags.string({required: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(VolumesImport)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${getDisco(flags.disco || null).host}/api/projects/${flags.project}/volumes/${flags.volume}`

    const res = await request({method: 'PUT', url, discoConfig, bodyStream: process.stdin})
    await res.json()
  }
}
