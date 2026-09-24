import {Args, Command, Flags} from '@oclif/core'

import {readEventSource, request} from '../../auth-request.js'
import {DiscoConfig, getDisco} from '../../config.js'
import {CreateResult, DefaultDomainError, chooseDefaultDomain, createWithFreeDomain, resolvePublic} from '../../default-domain.js'
import {GithubReposResponse} from '../github/repos/list.js'
import {ProjectCreateResponse} from '../postgres/addon/install.js'

export default class ProjectsAdd extends Command {
  static override args = {
    variables: Args.string({description: 'environment variables to set'}),
  }

  // set to be able to receive variable number of arguments
  static strict = false

  static description = `add a project to an existing disco instance

this will deploy the project. from that point on, every "git push" to the project's repo will automatically trigger a new deployment.

for most projects, you will need to pass a name and a github repo. you can optionally pass a domain name and environment variables as well.

without --domain, the project gets <name>.<your disco host> automatically when your server uses a disco-provided host (something.ondis.co) or your own host has a wildcard dns record. pass --domain to choose the domain, or --no-domain for internal services (workers, databases) that do not serve http.`

  static examples = [
    '<%= config.bin %> <%= command.id %> --name myblog --github myuser/myblog',
    '<%= config.bin %> <%= command.id %> --name myblog --domain blog.example.com --github myuser/myblog',
    '<%= config.bin %> <%= command.id %> --name myblog --domain blog.example.com --github myuser/myblog API_KEY=09asf07gaq0 OTHER_ENV_VAR=true',
    '<%= config.bin %> <%= command.id %> --name worker --no-domain --github myuser/worker',
  ]

  static flags = {
    name: Flags.string({required: true, description: 'project name'}),
    domain: Flags.string({
      required: false,
      description: 'domain name where the app will be served, e.g. www.example.com. Without it, <name>.<your disco host> is used',
    }),
    'no-domain': Flags.boolean({
      required: false,
      default: false,
      exclusive: ['domain'],
      description: 'create the project without a domain (workers, databases, anything that does not serve http)',
    }),
    github: Flags.string({
      required: false,
      description:
        'full name of the Github repository, including user or organization and repository name, e.g. myuser/myproject. ' +
        'Without it, deploy the project with "disco deploy --dir"',
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

    if (flags.github !== undefined && !flags.deployPublicRepo && !(await isGithubRepoAuthorized(discoConfig, flags.github))) {
      this.error(`disco does not have access to this GitHub repository.

Either set up GitHub access by running "disco github:apps:add"
or edit your GitHub repo permissions by running "disco github:apps:manage <your github username>".`)
    }

    const url = `https://${discoConfig.host}/api/projects`

    const envVariables = extractEnvVars(argv as string[])

    const create = async (domain: string | undefined, expectedStatuses: number[]): Promise<CreateResult<ProjectCreateResponse>> => {
      const body = {
        name: flags.name,
        githubRepo: flags.github,
        domain,
        branch: flags.branch,
        envVariables,
      }
      const res = await request({method: 'POST', url, discoConfig, body, expectedStatuses})
      if (res.status === 422) {
        const text = await res.text()
        if (isDomainTaken(text)) {
          return {status: 'domain-taken'}
        }

        throw new Error(`HTTP error: 422 ${text}`)
      }

      return {status: 'created', data: (await res.json()) as ProjectCreateResponse}
    }

    let data: ProjectCreateResponse
    let domain: string | undefined
    if (flags.domain !== undefined || flags['no-domain']) {
      const result = await create(flags.domain, [201])
      if (result.status !== 'created') {
        throw new Error('unreachable: 422 is not an expected status here')
      }

      data = result.data
      // the user chose the domain, no need to repeat it
    } else {
      try {
        const candidate = await chooseDefaultDomain({name: flags.name, host: discoConfig.host, resolve: resolvePublic})
        const result = await createWithFreeDomain({
          name: flags.name,
          host: discoConfig.host,
          domain: candidate,
          create: (d) => create(d, [201, 422]),
        })
        data = result.data
        domain = result.domain
      } catch (error) {
        if (error instanceof DefaultDomainError) {
          this.error(error.message)
        }

        throw error
      }
    }

    this.log(`Project added`)
    if (domain !== undefined) {
      this.log(`Domain: https://${domain}`)
    }

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

// the daemon answers a taken domain with a 422 whose validation error sits on the
// domain field of the body ("Domain already taken by a project" / "by Disco")
export function isDomainTaken(responseText: string): boolean {
  let body: unknown
  try {
    body = JSON.parse(responseText)
  } catch {
    return false
  }

  if (!body || typeof body !== 'object' || !('detail' in body) || !Array.isArray(body.detail)) {
    return false
  }

  return body.detail.some(
    (d: unknown) =>
      d !== null &&
      typeof d === 'object' &&
      'loc' in d &&
      Array.isArray(d.loc) &&
      d.loc.includes('domain') &&
      'msg' in d &&
      typeof d.msg === 'string' &&
      d.msg.includes('already taken'),
  )
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

async function isGithubRepoAuthorized(discoConfig: DiscoConfig, repoBeingChecked: string) {
  // check if the user has access to the github repo
  const url = `https://${discoConfig.host}/api/github-app-repos`

  const res = await request({method: 'GET', url, discoConfig})
  const data = (await res.json()) as GithubReposResponse

  const authorizedRepos = data.repos.map((r) => r.fullName)
  return authorizedRepos.includes(repoBeingChecked)
}
