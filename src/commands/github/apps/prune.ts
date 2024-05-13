import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../../config.js'
import {request} from '../../../auth-request.js'

export default class GithubAppsPrune extends Command {
  static description = 'prune Github apps'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(GithubAppsPrune)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/github-apps/prune`
    await request({method: 'POST', url, discoConfig, expectedStatuses: [200]})
  }
}
