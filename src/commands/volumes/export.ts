import {Command, Flags} from '@oclif/core'

import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export default class VolumesExport extends Command {
  static override description = 'export a volume'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  static override flags = {
    project: Flags.string({required: true}),
    disco: Flags.string({required: false}),
    volume: Flags.string({required: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(VolumesExport)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/${flags.project}/volumes/${flags.volume}`
    const res = await request({method: 'GET', url, discoConfig})
    // get binary data from response
    const data = await res.buffer()
    // write binary data to stdout
    process.stdout.write(data)
  }
}
