import {Args, Command, Flags} from '@oclif/core'

import {getDisco} from '../../config'
import {request} from '../../auth-request'

export default class ApikeysRemove extends Command {
  static override args = {
    publicKey: Args.string({description: 'public api key'}),
  }

  static override description = 'remove an api key'

  static override examples = ['<%= config.bin %> <%= command.id %> API_KEY']

  static override flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ApikeysRemove)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/.disco/api-keys/${args.publicKey}`
    await request({method: 'DELETE', url, discoConfig, expectedStatuses: [200, 204]})
  }
}
