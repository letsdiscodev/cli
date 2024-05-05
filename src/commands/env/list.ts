import {Command, Flags} from '@oclif/core'

import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export default class EnvList extends Command {
  static override description = 'list the env vars'

  static override examples = ['<%= config.bin %> <%= command.id %> --project mysite']

  static override flags = {
    project: Flags.string({required: true}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(EnvList)
    const discoConfig = getDisco(flags.disco || null)
    this.log(`Fetching env variables for ${flags.project}`)
    const url = `https://${discoConfig.host}/api/projects/${flags.project}/env`
    const res = await request({method: 'GET', url, discoConfig, expectedStatuses: [200, 404]})
    if (res.status === 404) {
      this.log('')
      return
    }

    const data = (await res.json()) as any
    for (const variable of data.envVariables) {
      this.log(`${variable.name}=${variable.value}`)
    }
  }
}
