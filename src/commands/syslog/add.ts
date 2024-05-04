import {Args, Command, Flags} from '@oclif/core'

import {getDisco} from '../../config'
import {request} from '../../auth-request'

export default class SyslogAdd extends Command {
  static override args = {
    syslogDestination: Args.string({description: 'syslog destination, should be syslog:// or syslog+tls:// protocol'}),
  }

  static override description = 'add a log destination'

  static override examples = [
    '<%= config.bin %> <%= command.id %> syslog://logs.example.com:4415',
    '<%= config.bin %> <%= command.id %> syslog+tls://logs.example.com:4415',
  ]

  static override flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(SyslogAdd)

    const discoConfig = getDisco(flags.disco || null)
    const requestUrl = `https://${discoConfig.host}/api/syslog`
    const res = await request({
      method: 'POST',
      url: requestUrl,
      discoConfig,
      body: {
        action: 'add',
        url: args.syslogDestination,
      },
    })

    const data = await res.json()
    if (data.urls.length > 0) {
      this.log('Current Syslog URLs:')
      for (const url of data.urls) {
        this.log(url)
      }
    } else {
      this.log('There is currently no Syslog URL set.')
    }
  }
}
