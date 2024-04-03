import {Command, Flags} from '@oclif/core'
import EventSource from 'eventsource'
import * as fs from 'node:fs'

import {certPath, getDisco} from '../config'

interface EventWithMessage extends Event {
  message?: string
}

export default class Logs extends Command {
  static description = 'fetch logs'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
    project: Flags.string({required: false}),
    service: Flags.string({required: false}),
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

    const es = new EventSource(url, {
      // agentOptions: {
      //   ca: fs.readFileSync('certs/ca.cert.pem'),
      // },
      headers: {
        Accept: 'text/event-stream',
        Authorization: 'Basic ' + Buffer.from(`${discoConfig.apiKey}:`).toString('base64'),
      },
      https: {
        ca: fs.readFileSync(certPath(discoConfig.ip)),
        rejectUnauthorized: true,
      },
    })

    es.addEventListener('message', (event: MessageEvent) => {
      const logItem = JSON.parse(event.data)

      if (!Object.keys(logItem.labels).includes('com.docker.swarm.service.name')) {
        return
      }

      const container = logItem.container.slice(1)
      const {message, timestamp} = logItem
      this.log(`${container} ${timestamp} ${message}`)
    })

    es.addEventListener('error', (event: EventWithMessage) => {
      // we're calling .warn as this.error can't be called here,
      // since it tries to throw an error -- but that, for some reason, doesn't
      // work ((because we're in an event listener? and/or maybe this
      // event listener is itself within a catch in the eventstream code..?))
      this.warn(event.message ?? 'An error occurred')
    })
  }
}
