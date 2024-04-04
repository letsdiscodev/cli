import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config'
import {getJsonRequest} from '../../auth-request'

export default class MetaInfo extends Command {
  static description = 'fetch info about the server'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(MetaInfo)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/.disco/disco/meta`

    getJsonRequest(url, discoConfig)
      .then((res) => {
        this.log(`Version:         ${res.version}`)
        this.log(`IP address:      ${res.ip}`)
        this.log(`Disco Host:      ${res.discoHost}`)
        this.log(`Registry Host:   ${res.registryHost}`)
      })
      .catch((error) => {
        this.warn(error?.message ?? 'An error occurred')
      })
  }
}
