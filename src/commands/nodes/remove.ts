import {Args, Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export default class NodesList extends Command {
  static description = 'initializes a new server'

  static examples = [
    '<%= config.bin %> <%= command.id %> root@disco.example.com',
    '<%= config.bin %> <%= command.id %> root@disco.example.com --version 0.4.0',
  ]

  static flags = {
    disco: Flags.string({required: false}),
  }

  static args = {
    name: Args.string({required: true}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(NodesList)
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
