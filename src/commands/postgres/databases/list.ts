import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../../config.js'
import {request} from '../../../auth-request.js'

type PostgresDatabase = {
  created: string;
  name: string;
}

export default class PostgresDatabasesList extends Command {
  static description = 'list Postgres databases'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
    instance: Flags.string({required: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PostgresDatabasesList)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/postgres-addon/cgi/endpoints/instances/${flags.instance}/databases`
    const res = await request({method: 'GET', url, discoConfig, expectedStatuses: [200]})
    const respBody = (await res.json()) as {databases: PostgresDatabase[]}
    for (const database of respBody.databases) {
      this.log(database.name)
    }
  }
}
