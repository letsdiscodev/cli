import {Args, Command, Flags} from '@oclif/core'

import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

interface RequestBody {
  domain: string;
}

export default class DomainsAdd extends Command {
  static override args = {
    domain: Args.string({description: 'domain name', required: true}),
  }

  static override description = 'add a domain name to the project'

  static override examples = [
    '<%= config.bin %> <%= command.id %> www.example.com --project mysite',
  ]

  static override flags = {
    project: Flags.string({required: true}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DomainsAdd)

    const discoConfig = getDisco(flags.disco || null)

    const url = `https://${discoConfig.host}/api/projects/${flags.project}/domains`
    const body: RequestBody = {
      domain: args.domain,
    }
    await request({method: 'POST', url, discoConfig, body, expectedStatuses: [201]})
  }
}
