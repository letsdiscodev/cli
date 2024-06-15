import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export default class PostgresTunnel extends Command {
  static description = 'create a temporary tunnel to access Postgres through localhost'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
    instance: Flags.string({required: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PostgresTunnel)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/tunnels`
    const reqBody = {
        project: `postgres-instance-${flags.instance}`,
        service: 'postgres',
    };

    const res = await request({
      method: 'POST',
      url,
      body: reqBody,
      discoConfig,
      expectedStatuses: [201],
    })
    const respBody = (await res.json()) as {tunnel: {host: string, password: string, port: number}}
    this.log(`host: ${respBody.tunnel.host}`)
    this.log(`password: ${respBody.tunnel.password}`)
    this.log(`port: ${respBody.tunnel.port}`)
  }
}
