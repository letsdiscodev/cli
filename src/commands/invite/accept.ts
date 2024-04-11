import {Args, Command, Flags} from '@oclif/core'
import fetch from 'node-fetch'

import {addDisco, isDiscoAlreadyInConfig} from '../../config'

export default class InvitesAccept extends Command {
  static override args = {
    url: Args.string({description: 'invite url', required: true}),
  }

  static override description = 'accept an invite to deploy to a server'

  static override examples = [
    '<%= config.bin %> <%= command.id %> https://mymachine.com/.disco/api-key-invites/8979ab987a9b879',
  ]

  static override flags = {
    'show-only': Flags.boolean({description: 'Show new API key only without updating CLI config'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(InvitesAccept)

    // not using request as this is a not an auth-signed request
    const res = await fetch(args.url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
    })
    if (res.status !== 200) {
      throw new Error(`HTTP error: ${res.status} ${await res.text()}`)
    }

    let showOnly = flags['show-only']
    const data = await res.json()

    if (isDiscoAlreadyInConfig(data.meta.discoHost)) {
      this.log(`server ${data.meta.discoHost} already in config, here's your API key:`)
      showOnly = true
    }

    if (showOnly) {
      this.log('')
      this.log(`Private Key: ${data.apiKey.privateKey}`)
      this.log(`Public Key:  ${data.apiKey.publicKey}`)
      this.log(`Host:        ${data.meta.discoHost}`)
      this.log(`IP:          ${data.meta.ip}`)
    } else {
      addDisco(data.meta.discoHost, data.meta.discoHost, data.meta.ip, data.apiKey.privateKey)
    }
  }
}
