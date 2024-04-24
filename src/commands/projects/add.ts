import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config'
import {request, readEventSource} from '../../auth-request'

export default class ProjectsAdd extends Command {
  static description = 'add a project'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    name: Flags.string({required: true, description: 'project name'}),
    domain: Flags.string({
      required: false,
      description: 'domain name where the app will be served, e.g. www.example.com',
    }),
    github: Flags.string({
      required: false,
      description:
        'full name of the Github repository, including user or organization and repository name, e.g. myuser/myproject',
    }),
    disco: Flags.string({required: false, description: 'server to use'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ProjectsAdd)

    if (flags.github !== undefined && !/^\S+\/\S+$/.test(flags.github)) {
      this.error('Invalid Github repository')
    }

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/.disco/projects`

    const body = {
      name: flags.name,
      githubRepo: flags.github,
      domain: flags.domain,
    }

    const res = await request({method: 'POST', url, discoConfig, body, expectedStatuses: [201]})
    const data = await res.json()

    this.log(`Project added`)

    if (data.deployment) {
      const project = flags.name
      this.log(`Deploying ${project}, version ${data.deployment.number}`)
      const url = `https://${discoConfig.host}/.disco/projects/${project}/deployments/${data.deployment.number}/output`

      readEventSource(url, discoConfig, {
        onMessage(event: MessageEvent) {
          process.stdout.write(JSON.parse(event.data).text)
        },
      })
    }
  }
}
