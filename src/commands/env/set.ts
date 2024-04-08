import {Args, Command, Flags} from '@oclif/core'

import {getDisco} from '../../config'
import {request, readEventSource} from '../../auth-request'

interface EnvVarRequestBody {
  envVariables: {name: string; value: string}[]
}

export default class EnvSet extends Command {
  static override args = {
    variables: Args.string({description: 'variables to set'}),
  }

  // set to be able to receive variable number of arguments
  static strict = false

  static override description = 'set env vars'

  static override examples = [
    '<%= config.bin %> <%= command.id %> API_KEY=0x97BCD3',
    '<%= config.bin %> <%= command.id %> API_KEY=0x97BCD3 OTHER_API_KEY=sk_f98a7f97as896',
  ]

  static override flags = {
    project: Flags.string({required: true}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {argv, flags} = await this.parse(EnvSet)

    const discoConfig = getDisco(flags.disco || null)

    const url = `https://${discoConfig.host}/.disco/projects/${flags.project}/env`
    const body: EnvVarRequestBody = {
      envVariables: [],
    }
    for (const variable of argv) {
      const parts = (variable as string).split('=')
      const varName = parts[0]
      let value = parts.slice(1).join('=')
      if (value[0] === value.slice(-1) && ['"', "'"].includes(value[0])) {
        value = value.slice(1, -1)
      }

      body.envVariables.push({name: varName, value})
    }

    const res = await request({method: 'POST', url, discoConfig, body})
    const data = await res.json()
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
