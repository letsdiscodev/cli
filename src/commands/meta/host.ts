import {confirm} from '@inquirer/prompts'
import {Args, Command, Flags} from '@oclif/core'

import {request} from '../../auth-request.js'
import {getDisco, setHost} from '../../config.js'
import {resolvePublic} from '../../default-domain.js'
import {HostCheckError, checkNewHost} from '../../host-check.js'

export interface SetHostResponse {
  version: string
  discoHost: string
  registryHost: null | string
}

// the network, dns and the prompt, swappable in tests
export const net = {request}
export const dns = {resolve: resolvePublic}
export const ui = {confirm}

export default class MetaHost extends Command {
  static description = `set the host of the server, the name the dashboard and the CLI talk to.

The new host must already resolve to the server (checked with public DNS) and you are asked to confirm, since a wrong host locks you out.`

  static examples = [
    '<%= config.bin %> <%= command.id %> disco.example.com',
    '<%= config.bin %> <%= command.id %> disco.example.com --force  # DNS deliberately elsewhere (a tunnel, a migration)',
  ]

  static args = {
    domain: Args.string({required: true}),
  }

  static flags = {
    disco: Flags.string({required: false}),
    force: Flags.boolean({default: false, description: 'skip the DNS check: the new host does not have to resolve to the server'}),
    'no-input': Flags.boolean({default: false, description: 'do not ask for confirmation'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(MetaHost)
    const discoConfig = getDisco(flags.disco || null)
    const newHost = args.domain

    if (newHost === discoConfig.host) {
      this.log(`${newHost} is already the host of ${discoConfig.name}. Nothing to do.`)
      return
    }

    if (!flags.force) {
      try {
        await checkNewHost({currentHost: discoConfig.host, newHost, resolve: dns.resolve})
      } catch (error) {
        if (error instanceof HostCheckError) {
          this.error(error.message)
        }

        throw error
      }
    }

    if (!flags['no-input']) {
      const yes = await ui.confirm({
        message: `Change the host of "${discoConfig.name}" from ${discoConfig.host} to ${newHost}?`,
        default: false,
      })
      if (!yes) {
        this.log('Not doing anything.')
        return
      }
    }

    const url = `https://${discoConfig.host}/api/disco/host`
    let data: SetHostResponse
    try {
      const res = await net.request({method: 'POST', url, discoConfig, body: {host: newHost}})
      data = (await res.json()) as SetHostResponse
    } catch (error) {
      this.error(`Could not set the host: ${(error as Error).message}`)
    }

    setHost(discoConfig.name, data.discoHost)
    this.log(`Host set to ${data.discoHost}`)
  }
}
