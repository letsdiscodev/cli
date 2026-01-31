import {Command} from '@oclif/core'
import {getConfig} from '../../config.js'

interface DiscosResponse {
  discos: string[]
}

export default class DiscosList extends Command {
  static override description = 'list the discos'

  static override enableJsonFlag = true

  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<DiscosResponse> {
    const config = getConfig()
    const discos = Object.keys(config.discos)

    if (discos.length === 0) {
      this.error('No discos found.')
    }

    for (const disco of discos) {
      this.log(disco)
    }

    return {discos}
  }
}
