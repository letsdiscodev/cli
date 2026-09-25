import {Command, Flags} from '@oclif/core'

import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

// the network, swappable in tests
export const net = {request}

export interface DeployCancelResponse {
  cancelledDeployments: {number: number}[]
}

export default class DeployCancel extends Command {
  static override description =
    'cancel a deployment for a project. without a deployment number, every queued or in progress deployment of the project is cancelled. ' +
    'an in progress deployment finishes cancelling after this returns, "disco deploy:output" follows it'

  static override enableJsonFlag = true

  static override examples = [
    '<%= config.bin %> <%= command.id %> --project mysite',
    '<%= config.bin %> <%= command.id %> --project mysite --deployment 4',
  ]

  static override flags = {
    project: Flags.string({required: true}),
    deployment: Flags.integer({required: false, default: 0}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<DeployCancelResponse> {
    const {flags} = await this.parse(DeployCancel)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/${flags.project}/deployments/${flags.deployment}`
    const res = await net.request({method: 'DELETE', url, discoConfig, expectedStatuses: [200, 422]})
    if (res.status === 422) {
      const respBody = (await res.json()) as {detail: string}
      this.error(respBody.detail)
    }

    const respBody = (await res.json()) as DeployCancelResponse
    if (respBody.cancelledDeployments.length === 0) {
      this.log('Nothing to cancel')
    }

    for (const deployment of respBody.cancelledDeployments) {
      this.log(`Cancelling deployment ${deployment.number}`)
    }

    return respBody
  }
}
