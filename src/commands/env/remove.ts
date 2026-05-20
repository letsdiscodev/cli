import {Args, Command, Flags} from '@oclif/core'

import {getDisco} from '../../config.js'
import {request, readEventSource} from '../../auth-request.js'

export interface EnvRemoveResponse {
  deployment: {
    number: number
  } | null
}

export default class EnvRemove extends Command {
  static override args = {
    envVars: Args.string({description: 'variable(s) to remove'}),
  }

  // set to be able to receive variable number of arguments
  static strict = false

  static override description = 'remove env vars'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --project mysite API_KEY',
    '<%= config.bin %> <%= command.id %> --project mysite API_KEY OTHER_KEY OLD_KEY',
  ]

  static override flags = {
    project: Flags.string({required: true}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {argv, flags} = await this.parse(EnvRemove)

    if (argv.length === 0) {
      this.error('No env variables specified')
    }

    const names = argv as string[]
    const discoConfig = getDisco(flags.disco || null)
    this.log(`Removing env variables for ${flags.project}: ${names.join(', ')}`)
    const url = `https://${discoConfig.host}/api/projects/${flags.project}/env`
    const body = {
      envVariables: names.map((name) => ({name, value: null})),
    }
    const res = await request({method: 'POST', url, discoConfig, body})
    const data = (await res.json()) as EnvRemoveResponse
    if (data.deployment) {
      // stream deployment
      const deploymentUrl = `https://${discoConfig.host}/api/projects/${flags.project}/deployments/${data.deployment.number}/output`
      readEventSource(deploymentUrl, discoConfig, {
        onMessage(event: MessageEvent) {
          const output = JSON.parse(event.data)
          process.stdout.write(output.text)
        },
      })
    }
  }
}
