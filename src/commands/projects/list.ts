import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

interface Project {
  name: string
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
    const data = (await res.json()) as any
    this.log(data.projects.map((project: Project) => project.name).join('\n'))
  }
}
