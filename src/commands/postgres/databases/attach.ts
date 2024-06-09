import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../../config.js'
import {request} from '../../../auth-request.js'

export default class PostgresDatabasesAttach extends Command {
  static description = 'attach a Postgres database to a project'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
    instance: Flags.string({required: true}),
    database: Flags.string({required: true}),
    'env-var': Flags.string({required: true, default: 'DATABASE_URL'}),
    project: Flags.string({required: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PostgresDatabasesAttach)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/postgres-addon/cgi/endpoints/instances/${flags.instance}/databases/${flags.database}/attach`
    const reqBody = {envVar: flags['env-var'], project: flags.project}
    await request({
      method: 'POST',
      url,
      discoConfig,
      body: reqBody,
      expectedStatuses: [200],
      extraHeaders: {
        'X-Disco-Include-API-Key': 'true',
      },
    })
  }
}
