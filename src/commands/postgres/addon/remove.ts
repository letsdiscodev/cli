import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../../config.js'
import {request} from '../../../auth-request.js'

export default class PostgresAddonRemove extends Command {
  static description = 'remove Postgres addon'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PostgresAddonRemove)
    const discoConfig = getDisco(flags.disco || null)
    const project = 'postgres-addon';
    const url = `https://${discoConfig.host}/api/projects/${project}`
    try {
      await request({method: 'DELETE', url, discoConfig, expectedStatuses: [200, 204]})
    } catch (error: unknown) {
      this.warn((error as {message: string}).message ?? 'An error occurred')
    }
  }
}
