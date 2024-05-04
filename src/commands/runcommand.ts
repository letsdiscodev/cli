import {Args, Command, Flags} from '@oclif/core'

import {getDisco} from '../config'
import {request, readEventSource} from '../auth-request'

export default class Runcommand extends Command {
  static override args = {
    project: Args.string({description: 'project to run command on'}),
    command: Args.string({description: 'command to run'}),
    args: Args.string({description: 'args to pass to command'}),
  }

  // set to be able to receive variable number of arguments
  static strict = false

  static override description = 'run a service-level (e.g. postgres) command'

  static override examples = ['<%= config.bin %> <%= command.id %> postgres db:add -- "--project flask"']

  static override flags = {
    timeout: Flags.integer({required: false, default: 600}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Runcommand)
    const discoConfig = getDisco(flags.disco || null)

    const url = `https://${discoConfig.host}/api/projects/${args.project}/runs`
    const body = {
      command: args.args,
      service: args.command,
      timeout: flags.timeout,
    }

    const res = await request({method: 'POST', url, discoConfig, body, expectedStatuses: [202]})
    const data = await res.json()
    const outputUrl = `https://${discoConfig.host}/api/projects/${args.project}/runs/${data.run.number}/output`
    readEventSource(outputUrl, discoConfig, {
      onMessage(event: MessageEvent) {
        const message = JSON.parse(event.data)
        process.stdout.write(message.text)
      },
    })
  }
}
