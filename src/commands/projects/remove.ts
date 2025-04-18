import {Args, Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'
import {confirm} from '@inquirer/prompts'

export default class ProjectsRemove extends Command {
  static args = {
    project: Args.string({description: 'project to remove', required: true}),
  }

  static description = 'remove a project'

  static examples = ['<%= config.bin %> <%= command.id %> project-name']

  static flags = {
    'no-input': Flags.boolean({default: false, description: 'do not ask for confirmation'}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ProjectsRemove)

    const discoConfig = getDisco(flags.disco || null)

    if (!flags['no-input']) {
      const response = await confirm({
        message: `Are you sure you want to remove the project "${args.project}"? This action cannot be undone.`,
        default: false,
      })
      if (!response) {
        this.log('Not doing anything.')
        return
      }
    }

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
