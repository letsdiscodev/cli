import {Command, Flags} from '@oclif/core'

import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export interface DeploymentItem {
  number: number
  created: string
  status: string
  commitHash: null | string
}

export interface DeploymentsResponse {
  deployments: DeploymentItem[]
}

export default class DeployList extends Command {
  static override description = 'list the deployments for a project'

  static override examples = ['<%= config.bin %> <%= command.id %> --project mysite']

  static override flags = {
    project: Flags.string({required: true}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DeployList)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/${flags.project}/deployments`
    const res = await request({method: 'GET', url, discoConfig})
    const data = (await res.json()) as DeploymentsResponse
    for (const deployment of data.deployments) {
      this.log(`${deployment.created}\t${deployment.number}\t${deployment.status}`)
    }
  }
}
