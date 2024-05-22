import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../../config.js'
import {request} from '../../../auth-request.js'

type PostgresDatabase = {
  created: string;
  name: string;
}

export default class PostgresDatabasesAdd extends Command {
  static description = 'add Postgres databases'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
    instance: Flags.string({required: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PostgresDatabasesAdd)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/postgres-addon/cgi/endpoints/instances/${flags.instance}/databases`
    const res = await request({method: 'POST', url, discoConfig, expectedStatuses: [201]})
    const respBody = (await res.json()) as {database: PostgresDatabase}
    this.log(respBody.database.name)
  }
}
