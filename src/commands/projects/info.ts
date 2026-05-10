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

export default class ProjectsInfo extends Command {
  static args = {
    project: Args.string({description: 'project to show', required: true}),
  }

  static description = 'show project details'

  static enableJsonFlag = true

  static examples = ['<%= config.bin %> <%= command.id %> project-name']

  static flags = {
    disco: Flags.string({required: false, description: 'server to use'}),
  }

  public async run(): Promise<ProjectResponse | undefined> {
    const {args, flags} = await this.parse(ProjectsInfo)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/${args.project}`

    let res
    try {
      res = await request({method: 'GET', url, discoConfig})
    } catch (error: unknown) {
      this.warn((error as {message: string}).message ?? 'An error occurred')
      return
    }

    const respBody = (await res.json()) as ProjectResponse
    const {project} = respBody
    if (project.github) {
      const branchPart = project.github.branch ? `#${project.github.branch}` : ''
      this.log(`${project.name} (${project.github.fullName}${branchPart})`)
    } else {
      this.log(`${project.name} (no github repo)`)
    }

    return respBody
  }
}
