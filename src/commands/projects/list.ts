import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config'
import {request} from '../../auth-request'

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
    const url = `https://${discoConfig.host}/.disco/projects`
    request({method: 'GET', url, discoConfig})
      .then((res) => {
        this.log(res.projects.map((project: Project) => project.name).join('\n'))
      })
      .catch((error) => {
        this.warn(error?.message ?? 'An error occurred')
      })
  }
}
