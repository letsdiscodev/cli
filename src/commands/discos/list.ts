import {Command} from '@oclif/core'
import {getConfig} from '../../config.js'

export default class DiscosList extends Command {
  static override description = 'list the discos'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    const config = getConfig()
    const discos = Object.keys(config.discos)
    for (const disco of discos) {
      this.log(disco)
    }
  }
}
