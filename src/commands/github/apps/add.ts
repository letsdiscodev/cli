import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../../config.js'
import {request} from '../../../auth-request.js'
import open from 'open'
import input from '@inquirer/input'

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

    // thanks @robsimmons for this excellent suggestion!
    this.log('')
    this.log("I'm about to open a browser that is going to create a GitHub Application.")
    this.log('This app will be named: Disco (some-random-name)')
    this.log('')
    this.log(
      "You'll be able to control which repositories disco has access to through this app. When you 'git push' changes to an authorized repo, disco will automatically trigger a deployment.",
    )

    this.log('')
    const response = await input({message: 'Is it okay to open a browser? y/n', default: 'y'})
    if (response === 'n') {
      this.log('')
      this.log('You need to copy and paste this URL into a browser to finish setup:')
      this.log('')
      this.log(respBody.pendingApp.url)
      return
    }

    this.log('')
    this.log('Opening the URL to install the app:')
    this.log('')
    this.log(respBody.pendingApp.url)
    this.log('')
    this.log('(If the URL does not open, please copy and paste it into your browser)')
    await open(respBody.pendingApp.url)
  }
}
