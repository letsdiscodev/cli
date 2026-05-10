import {Args, Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

interface Project {
  name: string
  github: {
    fullName: string
    branch: null | string
  } | null
}

interface ProjectResponse {
  project: Project
}

export default class ProjectsUpdate extends Command {
  static args = {
    project: Args.string({description: 'project to update', required: true}),
  }

  static description = `update editable project settings

pass --github to set the Github repo, or --no-github to clear it. pass --branch to set the branch, or --no-branch to clear it. omit a flag to leave the field unchanged. this does not trigger a deployment.`

  static enableJsonFlag = true

  static examples = [
    '<%= config.bin %> <%= command.id %> myblog --branch dev',
    '<%= config.bin %> <%= command.id %> myblog --github myuser/myblog --branch main',
    '<%= config.bin %> <%= command.id %> myblog --no-github',
    '<%= config.bin %> <%= command.id %> myblog --no-branch',
  ]

  static flags = {
    github: Flags.string({
      required: false,
      description: 'full name of the Github repository, e.g. myuser/myproject',
      exclusive: ['no-github'],
    }),
    'no-github': Flags.boolean({
      required: false,
      description: 'clear the Github repository link',
      exclusive: ['github'],
    }),
    branch: Flags.string({
      required: false,
      description: 'the branch of the repository to use',
      exclusive: ['no-branch'],
    }),
    'no-branch': Flags.boolean({
      required: false,
      description: 'clear the branch (use default of main/master)',
      exclusive: ['branch'],
    }),
    disco: Flags.string({required: false, description: 'server to use'}),
  }

  public async run(): Promise<ProjectResponse | undefined> {
    const {args, flags} = await this.parse(ProjectsUpdate)

    const setGithub = flags.github !== undefined
    const clearGithub = flags['no-github']
    const setBranch = flags.branch !== undefined
    const clearBranch = flags['no-branch']

    if (!setGithub && !clearGithub && !setBranch && !clearBranch) {
      this.error('Nothing to update. Pass --github, --branch, --no-github, or --no-branch.')
    }

    if (setGithub && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(flags.github!)) {
      this.error('Invalid Github repository format, expected "user/repo"')
    }

    const discoConfig = getDisco(flags.disco || null)

    const body: {branch?: null | string; githubRepo?: null | string} = {}
    if (setGithub) {
      body.githubRepo = flags.github!
    } else if (clearGithub) {
      body.githubRepo = null
    }

    if (setBranch) {
      body.branch = flags.branch!
    } else if (clearBranch) {
      body.branch = null
    }

    const url = `https://${discoConfig.host}/api/projects/${args.project}`

    let res
    try {
      res = await request({method: 'PATCH', url, discoConfig, body})
    } catch (error: unknown) {
      this.warn((error as {message: string}).message ?? 'An error occurred')
      return
    }

    const respBody = (await res.json()) as ProjectResponse
    this.log('Project updated.')
    return respBody
  }
}
