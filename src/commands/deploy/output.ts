import {Command, Flags} from '@oclif/core'

import {getDisco} from '../../config.js'
import {readEventSource} from '../../auth-request.js'

export default class DeployOutput extends Command {
  static override description = 'see the output of the latest deployment, or a particular deployment'

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
    const {flags} = await this.parse(DeployOutput)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/${flags.project}/deployments/${flags.deployment}/output`
    readEventSource(url, discoConfig, {
      onMessage(event: MessageEvent) {
        const message = JSON.parse(event.data)
        process.stdout.write(message.text)
      },
    })
  }
}
