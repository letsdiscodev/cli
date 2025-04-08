import {Args, Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request, readEventSource} from '../../auth-request.js'

export default class ProjectsAdd extends Command {
  static override args = {
    variables: Args.string({description: 'environment variables to set'}),
  }

  // set to be able to receive variable number of arguments
  static strict = false

  static description = `add a project to an existing disco instance

this will deploy the project. from that point on, every "git push" to the project's repo will automatically trigger a new deployment.

for most projects, you will need to pass a name, a domain name and a github repo. you can optionally pass environment variables as well.`

  static examples = [
    '<%= config.bin %> <%= command.id %> --name myblog --domain blog.example.com --github myuser/myblog',
    '<%= config.bin %> <%= command.id %> --name myblog --domain blog.example.com --github myuser/myblog API_KEY=09asf07gaq0 OTHER_ENV_VAR=true',
  ]

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
    const {argv, flags} = await this.parse(ProjectsAdd)

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

    const envVariables = extractEnvVars(argv as string[])

    const body = {
      name: flags.name,
      githubRepo: flags.github,
      domain: flags.domain,
      branch: flags.branch,
      envVariables,
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

// based on code in env/set.ts
function extractEnvVars(argv: string[]): {name: string; value: string}[] {
  const envVars: {name: string; value: string}[] = []
  for (const variable of argv) {
    const parts = (variable as string).split('=')
    const name = parts[0]
    let value = parts.slice(1).join('=')
    if (value[0] === value.slice(-1) && ['"', "'"].includes(value[0])) {
      value = value.slice(1, -1)
    }

    envVars.push({
      name,
      value,
    })
  }

  return envVars
}

async function isGithubRepoAuthorized(discoConfig: any, repoBeingChecked: string) {
  // check if the user has access to the github repo
  const url = `https://${discoConfig.host}/api/github-app-repos`

  const res = await request({method: 'GET', url, discoConfig})
  const data = (await res.json()) as any

  const authorizedRepos = data.repos.map((r: any) => r.fullName)
  return authorizedRepos.includes(repoBeingChecked)
}
