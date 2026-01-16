import {Args, Command, Flags} from '@oclif/core'

import {getDisco} from '../config.js'
import {request, readEventSource} from '../auth-request.js'
import {checkShellSupport, runShell} from '../shell-client.js'

interface RunResponse {
  run: {
    number: number
  }
}

export default class Run extends Command {
  static override args = {
    command: Args.string({description: 'command to run', required: true}),
  }

  static override description = 'remotely run a command'

  static override examples = ['<%= config.bin %> <%= command.id %> --project mysite "python migrate.py"']

  static override flags = {
    project: Flags.string({required: true}),
    service: Flags.string({required: false}),
    timeout: Flags.integer({required: false, default: 600}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Run)

    const discoConfig = getDisco(flags.disco || null)

    // Check if server supports shell (version >= 0.28.0)
    const {supported: shellSupported} = await checkShellSupport(discoConfig)

    if (shellSupported && args.command) {
      // Use websocket shell for running commands
      try {
        const result = await runShell({
          project: flags.project,
          discoConfig,
          service: flags.service,
          command: args.command,
        })

        if (result.exitCode !== 0) {
          process.exitCode = result.exitCode;
        }
      } catch (error) {
        this.error((error as Error).message)
      }
    } else {
      // Fall back to legacy run endpoint
      const url = `https://${discoConfig.host}/api/projects/${flags.project}/runs`
      const body = {
        command: args.command,
        service: flags.service ?? null,
        timeout: flags.timeout,
      }
      const res = await request({method: 'POST', url, discoConfig, body, expectedStatuses: [202]})
      const data = (await res.json()) as RunResponse

      const outputUrl = `https://${discoConfig.host}/api/projects/${flags.project}/runs/${data.run.number}/output`
      await readEventSource(outputUrl, discoConfig, {
        onMessage(event: MessageEvent) {
          const message = JSON.parse(event.data)
          process.stdout.write(message.text)
        },
      })
    }
  }
}
