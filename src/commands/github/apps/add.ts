import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../../config.js'
import {request} from '../../../auth-request.js'
import open from 'open'

export default class GithubAppsAdd extends Command {
  static description = 'add a Github app'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    organization: Flags.string({required: false}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(GithubAppsAdd)
    const discoConfig = getDisco(flags.disco || null)
    const {organization} = flags
    const body = {
      organization,
    }
    const url = `https://${discoConfig.host}/api/github-apps/create`
    const res = await request({method: 'POST', url, discoConfig, body, expectedStatuses: [201]})
    const respBody = (await res.json()) as any
    this.log('Opening the URL to install the app:')
    this.log('')
    this.log(respBody.pendingApp.url)
    this.log('')
    this.log('(If the URL does not open, please copy and paste it into your browser)')
    await open(respBody.pendingApp.url)
  }
}
