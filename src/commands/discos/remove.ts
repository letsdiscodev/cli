import {Args, Command} from '@oclif/core'
import {getConfig, saveConfig} from '../../config.js'

export default class DiscosRemove extends Command {
  static override description = 'remove a disco from local config'

  static override examples = ['<%= config.bin %> <%= command.id %> my-disco.example.com']

  static args = {
    name: Args.string({required: true, description: 'the disco name/domain to remove'}),
  }

  public async run(): Promise<void> {
    const {args} = await this.parse(DiscosRemove)
    const {name} = args

    const config = getConfig()

    if (!(name in config.discos)) {
      this.error(`Disco "${name}" not found in config.`)
    }

    delete config.discos[name]
    saveConfig(config)

    this.log(`Removed "${name}" from config.`)
  }
}
