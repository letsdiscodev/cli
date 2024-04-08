import {Args, Command, Flags} from '@oclif/core'

import {getDisco} from '../../config'
import {request, readEventSource} from '../../auth-request'

export default class EnvRemove extends Command {
  static override args = {
    envVar: Args.string({description: 'variable to remove'}),
  }

  static override description = 'remove the env var'

  static override examples = ['<%= config.bin %> <%= command.id %> --project mysite API_KEY']

  static override flags = {
    project: Flags.string({required: true}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(EnvRemove)

    const discoConfig = getDisco(flags.disco || null)
    this.log(`Removing env variable for ${flags.project}: ${args.envVar}`)
    const url = `https://${discoConfig.host}/.disco/projects/${flags.project}/env/${args.envVar}`
    const res = await request({method: 'DELETE', url, discoConfig})
    const data = await res.json()
    if (data.deployment) {
      // stream deployment
      const deploymentUrl = `https://${discoConfig.host}/.disco/projects/${flags.project}/deployments/${data.deployment.number}/output`
      readEventSource(deploymentUrl, discoConfig, {
        onMessage(event: MessageEvent) {
          const output = JSON.parse(event.data)
          process.stdout.write(output.text)
        },
      })
    }
  }
}
