import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

interface Project {
  name: string
  github: {
    fullName: string
    branch: null | string
  } | null
}

export default class ProjectsList extends Command {
  static description = 'list projects'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ProjectsList)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects`
    const res = await request({method: 'GET', url, discoConfig})
    const respBody = (await res.json()) as {projects: Project[]}
    for (const project of respBody.projects) {
      const branchPart = project.github?.branch ? `#${project.github.branch}` : ''
      const githubRepoPart = project.github ? ` (${project.github.fullName}${branchPart})` : ''
      this.log(`${project.name}${githubRepoPart}`)
    }
  }
}
