import {Args, Command, Flags} from '@oclif/core'

import {getDisco} from '../config'
import {request, readEventSource} from '../auth-request'

export default class Run extends Command {
  static override args = {
    command: Args.string({description: 'command to run'}),
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
    const url = `https://${discoConfig.host}/api/projects/${flags.project}/runs`
    const body = {
      command: args.command,
      service: flags.service ?? null,
      timeout: flags.timeout,
    }
    const res = await request({method: 'POST', url, discoConfig, body, expectedStatuses: [202]})
    const data = await res.json()
    const outputUrl = `https://${discoConfig.host}/api/projects/${flags.project}/runs/${data.run.number}/output`
    readEventSource(outputUrl, discoConfig, {
      onMessage(event: MessageEvent) {
        const message = JSON.parse(event.data)
        process.stdout.write(message.text)
      },
    })
  }
}
