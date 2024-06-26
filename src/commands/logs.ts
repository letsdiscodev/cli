import {Command, Flags} from '@oclif/core'

import {getDisco} from '../config.js'
import {readEventSource} from '../auth-request.js'

export default class Logs extends Command {
  static description = 'fetch logs'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    project: Flags.string({required: false}),
    service: Flags.string({required: false}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Logs)

    if (!flags.project && flags.service) {
      this.error('Must specify project when specifying service', {exit: 1})
    }

    const discoConfig = getDisco(flags.disco || null)

    let url = `https://${discoConfig.host}/api/logs`

    if (flags.project) {
      url = `${url}/${flags.project}`
    }

    if (flags.service) {
      url = `${url}/${flags.service}`
    }

    readEventSource(url, discoConfig, {
      onMessage: (event: MessageEvent) => {
        const logItem = JSON.parse(event.data)
        const container = logItem.container.slice(1)
        const {message, timestamp} = logItem
        this.log(`${container} ${timestamp} ${message}`)
      },
    })
  }
}
