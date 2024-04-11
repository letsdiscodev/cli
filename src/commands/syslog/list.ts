import {Command, Flags} from '@oclif/core'

import {getDisco} from '../../config'
import {request} from '../../auth-request'

export default class SyslogList extends Command {
  static override description = 'see list of all log destinations'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  static override flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(SyslogList)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/.disco/syslog`
    const res = await request({method: 'GET', url, discoConfig})
    const data = await res.json()

    if (data.urls.length > 0) {
      console.log('Current Syslog URLs:')
      for (const url of data.urls) {
        console.log(url)
      }
    } else {
      console.log('There is currently no Syslog URL set.')
    }
  }
}
