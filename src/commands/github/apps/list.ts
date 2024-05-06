import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../../config.js'
import {request} from '../../../auth-request.js'

type GithubApp = {
  id: number
  owner: {
    id: number
    login: string
    type: 'Organization' | 'User'
  }
  appUrl: string
  installUrl: string
  installation: {
    id: number
    manageUrl: string
  } | null
}

export default class GithubAppsList extends Command {
  static description = 'list Github apps'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(GithubAppsList)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/github-apps`
    const res = await request({method: 'GET', url, discoConfig, expectedStatuses: [200]})
    const respBody = (await res.json()) as {githubApps: GithubApp[]}
    for (const githubApp of respBody.githubApps) {
      this.log(`${githubApp.owner.login} (${githubApp.owner.type})`)
    }
  }
}
