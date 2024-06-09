import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../../config.js'
import {request} from '../../../auth-request.js'

export default class PostgresInstancesRemove extends Command {
  static description = 'remove a Postgres instance'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
    instance: Flags.string({required: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PostgresInstancesRemove)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/postgres-addon/cgi/endpoints/instances/${flags.instance}`
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
