import {Args, Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export default class NodesRemove extends Command {
  static description = 'remove node'

  static examples = [
    '<%= config.bin %> <%= command.id %> brilliant-fleet',
  ]

  static flags = {
    disco: Flags.string({required: false}),
  }

  static args = {
    name: Args.string({required: true}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(NodesRemove)
    const {disco} = flags
    const {name} = args;

    const discoConfig = getDisco(disco || null)
    const url = `https://${discoConfig.host}/api/disco/swarm/nodes/${name}`
    await request({
      method: 'DELETE',
      url,
      discoConfig,
    })
    this.log('Node removed')
  }
}
