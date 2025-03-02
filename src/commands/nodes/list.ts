import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export default class NodesList extends Command {
  static description = 'show node list'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(NodesList)
    const {disco} = flags

    const discoConfig = getDisco(disco || null)

    const url = `https://${discoConfig.host}/api/disco/swarm/nodes`
    const res = await request({
      method: 'GET',
      url,
      discoConfig,
    })
    const {nodes} = (await res.json()) as {
      nodes: {
        created: string,
        name: string,
        state: string,
        address: string,
        isLeader: boolean,
      }[]
    }

    for (const node of nodes) {
      this.log(`${node.name} [${node.address}]${node.isLeader ? ' (main)' : ''}`);
    }
  }
}
