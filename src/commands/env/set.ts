import {Args, Command, Flags} from '@oclif/core'

import {getDisco} from '../../config.js'
import {request, readEventSource} from '../../auth-request.js'

// the network, swappable in tests
export const net = {readEventSource, request}

interface EnvVarRequestBody {
  envVariables: {name: string; value: null | string}[]
}

export interface EnvSetResponse {
  deployment: {
    number: number
  } | null
}

export default class EnvSet extends Command {
  static override args = {
    variables: Args.string({description: 'variables to set'}),
  }

  // set to be able to receive variable number of arguments
  static strict = false

  static override description = 'set env vars'

  static override enableJsonFlag = true

  static override examples = [
    '<%= config.bin %> <%= command.id %> API_KEY=0x97BCD3',
    '<%= config.bin %> <%= command.id %> API_KEY=0x97BCD3 OTHER_API_KEY=sk_f98a7f97as896',
  ]

  static override flags = {
    project: Flags.string({required: true}),
    remove: Flags.string({
      multiple: true,
      description: 'env var name(s) to delete as part of this call',
    }),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<EnvSetResponse> {
    const {argv, flags} = await this.parse(EnvSet)

    const discoConfig = getDisco(flags.disco || null)

    const url = `https://${discoConfig.host}/api/projects/${flags.project}/env`
    const body: EnvVarRequestBody = {
      envVariables: [],
    }
    // de-dupe this code as it also exists in projects:add
    for (const variable of argv) {
      const parts = (variable as string).split('=')
      const varName = parts[0]
      let value = parts.slice(1).join('=')
      if (value[0] === value.slice(-1) && ['"', "'"].includes(value[0])) {
        value = value.slice(1, -1)
      }

      body.envVariables.push({name: varName, value})
    }

    for (const name of flags.remove || []) {
      body.envVariables.push({name, value: null})
    }

    const res = await net.request({method: 'POST', url, discoConfig, body})
    const data = (await res.json()) as EnvSetResponse
    // --json returns the number right away, "disco deploy:output" follows the deployment
    if (this.jsonEnabled()) {
      return {deployment: data.deployment}
    }

    if (data.deployment) {
      // stream deployment
      const deploymentUrl = `https://${discoConfig.host}/api/projects/${flags.project}/deployments/${data.deployment.number}/output`
      net.readEventSource(deploymentUrl, discoConfig, {
        onMessage(event: MessageEvent) {
          const output = JSON.parse(event.data)
          process.stdout.write(output.text)
        },
      })
    }

    return {deployment: data.deployment}
  }
}
