import {Args, Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export default class RegistriesSet extends Command {
  static args = {
    address: Args.string({required: true, description: 'registry address, e.g. ghcr.io'}),
  }

  static description = `set the default Docker registry for the disco server`

  static examples = ['<%= config.bin %> <%= command.id %> ghcr.io/myuser']

  static flags = {
    disco: Flags.string({required: false, description: 'server to use'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(RegistriesSet)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/disco/registry`
    const body = {
      address: args.address,
    }
    await request({method: 'POST', url, discoConfig, body, expectedStatuses: [200]})
  }
}
