import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config'
import {request, readEventSource, EventWithMessage} from '../../auth-request'

export default class ProjectsAdd extends Command {
  static description = 'add a project'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    name: Flags.string({required: true, description: 'project name'}),
    domain: Flags.string({
      required: false,
      description: 'domain name where the app will be served, e.g. www.example.com',
    }),
    'github-repo': Flags.string({
      required: false,
      description: 'URL used to clone the repo, e.g. git@github.com:example/example.git',
    }),
    disco: Flags.string({required: false, description: 'server to use'}),
    deploy: Flags.boolean({required: false, description: 'deploy the project after adding it'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ProjectsAdd)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/.disco/projects`

    const body = {
      name: flags.name,
      githubRepo: flags['github-repo'],
      domain: flags.domain,
      deploy: flags.deploy,
    }

    let res
    try {
      res = await request({method: 'POST', url, discoConfig, body, expectedStatuses: [201]})
    } catch (error: unknown) {
      this.warn((error as {message: string}).message ?? 'An error occurred')
      return
    }

    this.log(`Project added`)

    if (res.project.githubRepo) {
      this.log('')

      const m = /^((git@)|(https:\/\/))github\.com(:|\/)?(?<repo>\S+)\.git$/.exec(res.project.githubRepo)

      let repo
      if (m) {
        repo = m.groups!.repo
      } else {
        this.log(`Couldn't parse Github repo: ${res.project.githubRepo}`)
        repo = 'your-repo-here'
      }

      if (res.sshKeyPub) {
        this.log('')
        this.log('Github Deploy Key')
        this.log('=================')
        this.log('')
        this.log('You need to give read access to your repo to Disco.')
        this.log(`Open https://github.com/${repo}/settings/keys/new`)
        this.log('')
        this.log('Title: Give it the title you want, for example: "Disco".')
        this.log('')
        this.log('Key:')
        this.log(res.sshKeyPub)
        this.log('No need for write access.')
      }

      if (res.project.githubWebhookToken) {
        this.log('')
        let webhookHost = res.project.domain
        if (!webhookHost) {
          webhookHost = discoConfig.host
        }

        this.log('')
        this.log('Github Webhook')
        this.log('==============')
        this.log('')
        this.log('To deploy automatically when commits are pushed.')
        this.log(`Open https://github.com/${repo}/settings/hooks/new`)
        this.log('')
        this.log('Payload URL')
        this.log(`https://${webhookHost}/.disco/webhooks/github/${res.project.githubWebhookToken}`)
        this.log('')
        this.log('SSL verification: Enable SSL verification')
        this.log('Content type: application/json')
        this.log('Secret: leave empty.')
        this.log('Just the push event.')
        this.log('Check "Active".')
      }
    }

    if (res.deployment) {
      const project = flags.name
      this.log(`Deploying ${project}, version ${res.deployment.number}`)
      const url = `https://${discoConfig.host}/.disco/projects/${project}/deployments/${res.deployment.number}/output`

      readEventSource(url, discoConfig, {
        onMessage(event: MessageEvent) {
          process.stdout.write(JSON.parse(event.data).text)
        },
        onError: (event: EventWithMessage) => {
          this.error(event.message ?? 'An error occurred')
        },
      })
    }
  }
}
