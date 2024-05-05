import {Args, Command, Flags} from '@oclif/core'
import {getDisco} from '../../../config.js'
import {request} from '../../../auth-request.js'

export default class GithubAppsManage extends Command {
  static description = 'manage Github app'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
  }

  static override args = {
    owner: Args.string({description: 'the user or org name from Github', required: true}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(GithubAppsManage)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/github-apps`
    const res = await request({method: 'GET', url, discoConfig, expectedStatuses: [200]})
    const respBody = await res.json()
    const filteredApps = respBody.githubApps.filter((app) => app.owner.login === args.owner)
    if (filteredApps.length === 0) {
      this.error('Not found. You can install the Github app with github:apps:add')
    }

    if (filteredApps.length > 1) {
      this.error('There are more than one app for that owner')
    }

    const githubApp = filteredApps[0]
    if (githubApp.installation === null) {
      this.log('Complete installation here')
      this.log(githubApp.installUrl)
    } else {
      this.log('Manage installation here')
      this.log(githubApp.installation.manageUrl)
    }
  }
}
