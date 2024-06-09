import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../../config.js'
import {request} from '../../../auth-request.js'

type PostgresInstance = {
  name: string
}

export default class PostgresInstancesList extends Command {
  static description = 'list Postgres instances'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PostgresInstancesList)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/postgres-addon/cgi/endpoints/instances`
    const res = await request({
      method: 'GET',
      url,
      discoConfig,
      expectedStatuses: [200],
      extraHeaders: {
        'X-Disco-Include-API-Key': 'true',
      },
    })
    const respBody = (await res.json()) as {instances: PostgresInstance[]}
    for (const instance of respBody.instances) {
      this.log(instance.name)
    }
  }
}
