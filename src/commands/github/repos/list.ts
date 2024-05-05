import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../../config.js'
import {request} from '../../../auth-request.js'

export default class GithubReposList extends Command {
  static description = 'list Github repos accessible thoughs Github Apps'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(GithubReposList)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/github-app-repos`

    const res = await request({method: 'GET', url, discoConfig})
    const data = (await res.json()) as any
    for (const repo of data.repos) {
      this.log(repo.fullName)
    }
  }
}
