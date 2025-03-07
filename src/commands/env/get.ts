import {Args, Command, Flags} from '@oclif/core'

import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

interface EnvVarResponse {
  envVariable: {
    value: string
  }
}

export default class EnvGet extends Command {
  static override args = {
    envVar: Args.string({description: 'environment variable to read'}),
  }

  static override description = 'read one environment variable'

  static override examples = ['<%= config.bin %> <%= command.id %> --project mysite API_KEY']

  static override flags = {
    project: Flags.string({required: true}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(EnvGet)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/${flags.project}/env/${args.envVar}`
    const res = await request({method: 'GET', url, discoConfig, expectedStatuses: [200, 404]})

    // env var not found
    if (res.status === 404) {
      this.log('')
      return
    }

    const data: EnvVarResponse = (await res.json()) as any
    this.log(data.envVariable.value)
  }
}
