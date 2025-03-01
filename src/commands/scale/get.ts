import {Command, Flags} from '@oclif/core'

import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export default class ScaleGet extends Command {
  static override args = {}

  static strict = false

  static override description = 'get current scale (number of replicas) for all services of a project'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --project mysite',
  ]

  static override flags = {
    project: Flags.string({required: true}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ScaleGet)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/${flags.project}/scale`

    const res = await request({method: 'GET', url, discoConfig})
    const respBody = (await res.json()) as {services: {name: string; scale: number}[]}
    for (const service of respBody.services) {
      this.log(`${service.name}=${service.scale}`)
    }
  }
}
