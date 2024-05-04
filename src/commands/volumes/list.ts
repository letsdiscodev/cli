import {Command, Flags} from '@oclif/core'

import {getDisco} from '../../config'
import {request} from '../../auth-request'

export default class VolumesList extends Command {
  static override description = "list all project's volumes"

  static override examples = ['<%= config.bin %> <%= command.id %> --project mysite']

  static override flags = {
    project: Flags.string({required: true}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(VolumesList)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/${flags.project}/volumes`
    const res = await request({method: 'GET', url, discoConfig})
    const data = await res.json()
    for (const volume of data.volumes) {
      this.log(volume.name)
    }
  }
}
