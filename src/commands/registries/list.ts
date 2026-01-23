import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export default class RegistriesList extends Command {
  static description = `list all Docker registries that have authentication data`

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false, description: 'server to use'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(RegistriesList)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/disco/registries`
    const res = await request({method: 'GET', url, discoConfig, expectedStatuses: [200]})
    const respBody = (await res.json()) as {
      registries: {address: string}[]
    }
    for (const registry of respBody.registries) {
      this.log(registry.address)
    }
  }
}
