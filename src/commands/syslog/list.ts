import {Command, Flags} from '@oclif/core'

import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export interface SyslogResponse {
  urls: string[]
}

export default class SyslogList extends Command {
  static override description = 'see list of all log destinations'

  static override enableJsonFlag = true

  static override examples = ['<%= config.bin %> <%= command.id %>']

  static override flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<SyslogResponse> {
    const {flags} = await this.parse(SyslogList)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/syslog`
    const res = await request({method: 'GET', url, discoConfig})
    const data = (await res.json()) as SyslogResponse

    if (data.urls.length > 0) {
      this.log('Current Syslog URLs:')
      for (const syslogUrl of data.urls) {
        this.log(syslogUrl)
      }
    } else {
      this.log('There is currently no Syslog URL set.')
    }

    return data
  }
}
