import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export default class RegistriesUnset extends Command {
  static description = `unset the default Docker registry for the disco server`

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false, description: 'server to use'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(RegistriesUnset)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/disco/registry`
    await request({method: 'DELETE', url, discoConfig, expectedStatuses: [200]})
  }
}
