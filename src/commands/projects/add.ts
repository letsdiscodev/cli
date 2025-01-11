import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request, readEventSource} from '../../auth-request.js'

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
      required: true,
      description:
        'full name of the Github repository, including user or organization and repository name, e.g. myuser/myproject',
    }),
    branch: Flags.string({
      required: false,
      description: 'the branch of the repository to use',
    }),
    deployPublicRepo: Flags.boolean({
      required: false,
      description:
        'deploy a public repository without checking for GitHub access. Note that "git push" to the repo will not trigger a new deployment',
    }),
    disco: Flags.string({required: false, description: 'server to use'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ProjectsAdd)

    if (flags.github !== undefined && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(flags.github)) {
      this.error('Invalid Github repository format, expected "user/repo"')
    }

    const discoConfig = getDisco(flags.disco || null)

    if (!flags.deployPublicRepo && !(await isGithubRepoAuthorized(discoConfig, flags.github))) {
      this.error(`disco does not have access to this GitHub repository.

Either set up GitHub access by running "disco github:apps:add"
or edit your GitHub repo permissions by running "disco github:apps:manage <your github username>".`)
    }

    const url = `https://${discoConfig.host}/api/projects`

    const body = {
      name: flags.name,
      githubRepo: flags.github,
      domain: flags.domain,
      branch: flags.branch,
    }

    const res = await request({method: 'POST', url, discoConfig, body, expectedStatuses: [201]})
    const data = (await res.json()) as any

    this.log(`Project added`)

    if (data.deployment) {
      const project = flags.name
      this.log(`Deploying ${project}, version ${data.deployment.number}`)
      const url = `https://${discoConfig.host}/api/projects/${project}/deployments/${data.deployment.number}/output`

      readEventSource(url, discoConfig, {
        onMessage(event: MessageEvent) {
          process.stdout.write(JSON.parse(event.data).text)
        },
      })
    }
  }
}

async function isGithubRepoAuthorized(discoConfig: any, repoBeingChecked: string) {
  // check if the user has access to the github repo
  const url = `https://${discoConfig.host}/api/github-app-repos`

  const res = await request({method: 'GET', url, discoConfig})
  const data = (await res.json()) as any

  const authorizedRepos = data.repos.map((r: any) => r.fullName)
  return authorizedRepos.includes(repoBeingChecked)
}
