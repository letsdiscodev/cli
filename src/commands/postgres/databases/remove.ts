import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../../config.js'
import {request} from '../../../auth-request.js'

export default class PostgresDatabasesRemove extends Command {
  static description = 'remove a Postgres database'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
    instance: Flags.string({required: true}),
    database: Flags.string({required: true}),
    detach: Flags.boolean({default: false, description: 'detach from any project the database was attached to'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PostgresDatabasesRemove)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/postgres-addon/cgi/endpoints/instances/${flags.instance}/databases/${flags.database}?detach=${flags.detach ? 'true' : 'false'}`
    await request({
      method: 'DELETE',
      url,
      discoConfig,
      expectedStatuses: [200],
      extraHeaders: {
        'X-Disco-Include-API-Key': 'true',
      },
    })
  }
}
