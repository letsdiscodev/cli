import {Command, Args, Flags} from '@oclif/core'
import {getDisco, setHost} from '../../config'
import {request} from '../../auth-request'

export default class MetaHost extends Command {
  static description = 'set a host for the server'

  static examples = ['<%= config.bin %> <%= command.id %> example.com']

  static args = {
    domain: Args.string({required: true}),
  }

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(MetaHost)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/disco/host`

    request({method: 'POST', url, discoConfig, body: {host: args.domain}})
      .then(async (res) => {
        const data = await res.json()
        this.log(`Host set to ${args.domain}`)
        setHost(discoConfig.name, data.discoHost)
      })
      .catch((error) => {
        this.warn(error?.message ?? 'An error occurred')
      })
  }
}
