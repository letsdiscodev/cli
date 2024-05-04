import {Args, Command, Flags} from '@oclif/core'
import {getDisco} from '../../config'
import {request} from '../../auth-request'

export default class ProjectsRemove extends Command {
  static args = {
    project: Args.string({description: 'project to remove'}),
  }

  static description = 'remove a project'

  static examples = ['<%= config.bin %> <%= command.id %> project-name']

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ProjectsRemove)

    const discoConfig = getDisco(flags.disco || null)

    const url = `https://${discoConfig.host}/api/projects/${args.project}`
    try {
      await request({method: 'DELETE', url, discoConfig, expectedStatuses: [200, 204]})
    } catch (error: unknown) {
      this.warn((error as {message: string}).message ?? 'An error occurred')
      return
    }

    this.log('Project removed.')
  }
}
