import {Command, Flags} from '@oclif/core'

import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export default class DeployCancel extends Command {
  static override description = 'cancel a deployment for a project'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --project mysite',
    '<%= config.bin %> <%= command.id %> --project mysite --deployment 4',
  ]

  static override flags = {
    project: Flags.string({required: true}),
    deployment: Flags.integer({required: false, default: 0}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DeployCancel)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/${flags.project}/deployments/${flags.deployment}`
    const res = await request({method: 'DELETE', url, discoConfig, expectedStatuses:[200, 422]})
    if (res.status === 422) {
      console.log('Failed')
      const respBody = await res.json() as {detail: string}
      console.log(respBody.detail)
      return;
    }

    const respBody = await res.json() as {"cancelledDeployments": {"number": number}[]};
    for (const deployment of respBody.cancelledDeployments) {
      console.log(`Deployment ${deployment.number} cancelled`)
    }
  }
}
