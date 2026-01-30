import { Args, Command, Flags } from '@oclif/core'

import { request } from '../../auth-request.js'
import { getDisco } from '../../config.js'

export interface InviteCreateResponse {
  apiKeyInvite: {
    url: string
    expires: string
  }
}

export default class InvitesCreate extends Command {
  static override args = {
    name: Args.string({ description: 'api key invitee name', required: true }),
  }

  static override description =
    'invite someone to deploy to this server. server must have a dedicated domain name, see the meta:host command'

  static override examples = ['<%= config.bin %> <%= command.id %> --disco mymachine.com zoe']

  static override flags = {
    disco: Flags.string({ required: false }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(InvitesCreate)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/api-key-invites`
    const body = {
      name: args.name,
    }
    const res = await request({ method: 'POST', url, discoConfig, body, expectedStatuses: [201] })
    const data = (await res.json()) as InviteCreateResponse
    const inviteUrl = data.apiKeyInvite.url

    // Web dashboard URL (inviteUrl is not encoded - the dashboard expects the raw URL)
    const dashboardUrl = `https://dashboard.disco.cloud/accept-invite?inviteUrl=${inviteUrl}`

    // Try to shorten the URL
    let finalUrl = dashboardUrl
    try {
      const shortUrlRes = await fetch('https://backend.disco.cloud/api/short-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: dashboardUrl }),
      })
      if (shortUrlRes.ok) {
        const shortUrlData = (await shortUrlRes.json()) as { url?: string }
        if (shortUrlData.url) {
          finalUrl = shortUrlData.url
        }
      }
    } catch {
      // Ignore errors, use the full URL
    }

    this.log('')
    this.log('To manage this instance using the web dashboard, follow this link:')
    this.log('')
    this.log(`    ${finalUrl}`)
    this.log('    (expires in 24 hours)')
    this.log('')
    // CLI instructions
    this.log('If you\'re using the disco CLI, run this command:')
    this.log('')
    this.log(`    disco invite:accept ${inviteUrl}`)
    this.log('    (expires in 24 hours)')
    this.log('')
  }
}
