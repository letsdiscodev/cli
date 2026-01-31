import {Command, Flags} from '@oclif/core'

import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export interface DomainItem {
  id: string
  name: string
}

export interface DomainsResponse {
  domains: DomainItem[]
}

export default class DomainsList extends Command {
  static override description = 'list the domains'

  static override enableJsonFlag = true

  static override examples = ['<%= config.bin %> <%= command.id %> --project mysite']

  static override flags = {
    project: Flags.string({required: true}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<DomainsResponse> {
    const {flags} = await this.parse(DomainsList)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/${flags.project}/domains`
    const res = await request({method: 'GET', url, discoConfig, expectedStatuses: [200]})
    const data = (await res.json()) as DomainsResponse
    for (const domain of data.domains) {
      this.log(domain.name)
    }

    return data
  }
}
