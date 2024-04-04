import {Command, Flags} from '@oclif/core'

import {getDisco} from '../config'
import {readEventSource, EventWithMessage} from '../auth-request'

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

    let url = `https://${discoConfig.host}/.disco/logs`

    if (flags.project) {
      url = `${url}/${flags.project}`
    }

    if (flags.service) {
      url = `${url}/${flags.service}`
    }

    readEventSource(url, discoConfig, {
      onMessage: (event: MessageEvent) => {
        const logItem = JSON.parse(event.data)

        if (!Object.keys(logItem.labels).includes('com.docker.swarm.service.name')) {
          return
        }

        const container = logItem.container.slice(1)
        const {message, timestamp} = logItem
        this.log(`${container} ${timestamp} ${message}`)
      },
      onError: (event: EventWithMessage) => {
        // this.error throws a big ugly error in the cli
        // output which is bad. however, calling
        // this.warn will keep showing the error in a loop...
        this.error(event.message ?? 'An error occurred')
      },
    })
  }
}
