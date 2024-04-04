import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config'
import {initAuthEventSource, EventWithMessage} from '../../auth-event-source'

export default class MetaInfo extends Command {
  static description = 'fetch info about the server'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(MetaInfo)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/.disco/disco/met`

    console.log('url', url)

    initAuthEventSource(url, discoConfig, 'application/json', {
      onMessage: (event: MessageEvent) => {
        // const logItem = JSON.parse(event.data)
        // this.log(logItem)
      },
      onError: (event: EventWithMessage) => {
        console.log(event)
        this.warn(event.message ?? 'An error occurred')
      },
    })
  }
}
