import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config'
import {request} from '../../auth-request'

export default class MetaInfo extends Command {
  static description = 'fetch info about the server'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(MetaInfo)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/disco/meta`

    const res = await request({method: 'GET', url, discoConfig})
    const data = await res.json()
    this.log(`Version:         ${data.version}`)
    this.log(`Disco Host:      ${data.discoHost}`)
    this.log(`Registry Host:   ${data.registryHost}`)
  }
}
