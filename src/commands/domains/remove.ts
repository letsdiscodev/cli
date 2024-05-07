import {Args, Command, Flags} from '@oclif/core'

import {DiscoConfig, getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export default class DomainsRemove extends Command {
  static override args = {
    domain: Args.string({description: 'domain to remove', required: true}),
  }

  static override description = 'remove the domain'

  static override examples = ['<%= config.bin %> <%= command.id %> www.example.com --project mysite']

  static override flags = {
    project: Flags.string({required: true}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DomainsRemove)

    const discoConfig = getDisco(flags.disco || null)
    const domainId = await this.getDomainId(discoConfig, flags.project, args.domain)
    if (domainId === null) {
      return;
    }

    const url = `https://${discoConfig.host}/api/projects/${flags.project}/domains/${domainId}`
    await request({method: 'DELETE', url, discoConfig, expectedStatuses: [204]})
  }

  private async getDomainId(discoConfig: DiscoConfig, project: string, domain: string): Promise<null | string> {
    // get domains, to get ID
    const url = `https://${discoConfig.host}/api/projects/${project}/domains`
    const res = await request({method: 'GET', url, discoConfig, expectedStatuses: [200]})
    const data = (await res.json()) as {domains: {id: string, name: string}[]}
    const domainObj = data.domains.find(d => d.name === domain);
    return domainObj === undefined ? null : domainObj.id;

  }
}
