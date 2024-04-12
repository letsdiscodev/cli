import {Args, Command, Flags} from '@oclif/core'

import {getDisco} from '../config'
import {request} from '../auth-request'

export default class Scale extends Command {
  static override args = {
    services: Args.string({
      description: 'service or services to scale and number of replicas, e.g. web=3',
      required: true,
    }),
  }

  static strict = false

  static override description = 'scale one or multiple services from a project'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --project mysite web=1',
    '<%= config.bin %> <%= command.id %> --project mysite web=3 worker=2',
  ]

  static override flags = {
    project: Flags.string({required: true}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {argv, flags} = await this.parse(Scale)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/.disco/projects/${flags.project}/scale`
    const reqBody = {services: {}} as Record<string, Record<string, number>>
    for (const service of argv as string[]) {
      const parts = service.split('=')
      const serviceName = parts[0]
      const replicas = parts[1]
      reqBody.services[serviceName] = Number.parseInt(replicas, 10)
    }

    const res = await request({method: 'POST', url, body: reqBody, discoConfig})
    await res.json()
  }
}
