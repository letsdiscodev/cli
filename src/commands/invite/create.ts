import {Args, Command, Flags} from '@oclif/core'

import {getDisco} from '../../config'
import {request} from '../../auth-request'

export default class InvitesCreate extends Command {
  static override args = {
    name: Args.string({description: 'api key invitee name', required: true}),
  }

  static override description =
    'invite someone to deploy to this server. server must have a dedicated domain name, see the meta:host command'

  static override examples = ['<%= config.bin %> <%= command.id %> --disco mymachine.com zoe']

  static override flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(InvitesCreate)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/.disco/api-key-invites`
    const body = {
      name: args.name,
    }
    const res = await request({method: 'POST', url, discoConfig, body, expectedStatuses: [201]})
    const data = await res.json()
    this.log('Send this link to the new user:')
    this.log(data.apiKeyInvite.url)
  }
}
