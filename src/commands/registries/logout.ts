import {Args, Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export default class RegistriesLogout extends Command {
  static args = {
    address: Args.string({required: true, description: 'registry address, e.g. ghcr.io'}),
  }

  static description = `logout from a Docker registry`

  static examples = ['<%= config.bin %> <%= command.id %> ghcr.io']

  static flags = {
    disco: Flags.string({required: false, description: 'server to use'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(RegistriesLogout)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/disco/registries/${args.address}`
    await request({method: 'DELETE', url, discoConfig, expectedStatuses: [200]})
    this.log(`Logged out from ${args.address}`)
  }
}
