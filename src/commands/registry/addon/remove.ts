import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../../config.js'
import {request} from '../../../auth-request.js'

const addonProjectName = 'addon-registry';

export default class RegistryAddonRemove extends Command {
  static description = 'remove Registry addon'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(RegistryAddonRemove)
    const discoConfig = getDisco(flags.disco || null)
    {
      const url = `https://${discoConfig.host}/api/disco/registry`
      await request({method: 'DELETE', url, discoConfig, expectedStatuses: [200]})
    }

    {
      const url = `https://${discoConfig.host}/api/projects/${addonProjectName}`
      await request({method: 'DELETE', url, discoConfig, expectedStatuses: [200, 204]})
    }
  }
}
