import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'
import {createTunnel} from 'tunnel-ssh'

export default class PostgresTunnel extends Command {
  static description = 'create a temporary tunnel to access Postgres through localhost'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
    project: Flags.string({required: true}),
    'env-var': Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PostgresTunnel)
    const discoConfig = getDisco(flags.disco || null)

    const dbInfoUrl = `https://${discoConfig.host}/api/projects/postgres-addon/cgi/endpoints/tunnels`
    const dbInfoResponse = await request({
      method: 'POST',
      url: dbInfoUrl,
      body: {
        project: flags.project,
        envVar: flags['env-var'],
      },
      discoConfig,
      expectedStatuses: [200],
    })
    const dbInfoRespBody = (await dbInfoResponse.json()) as {
      dbInfo: {instance: string; database: string; user: string; password: string}
    }
    const {dbInfo} = dbInfoRespBody
    const url = `https://${discoConfig.host}/api/tunnels`
    const reqBody = {
      project: `postgres-instance-${dbInfo.instance}`,
      service: 'postgres',
    }
    const res = await request({
      method: 'POST',
      url,
      body: reqBody,
      discoConfig,
      expectedStatuses: [201],
    })
    const respBody = (await res.json()) as {tunnel: {host: string; password: string; port: number}}
    const tunnelPort = respBody.tunnel.port
    const connString = `postgresql://${dbInfo.user}:${dbInfo.password}@localhost/${dbInfo.database}`

    const sshOptions = {
      host: discoConfig.host,
      port: respBody.tunnel.port,
      username: 'root',
      password: respBody.tunnel.password,
    }

    const forwardOptions = {
      dstAddr: respBody.tunnel.host,
      dstPort: 5432,
    }

    const tunnelOptions = {
      autoClose: true,
    }

    const serverOptions = {
      host: 'localhost',
      port: 5432,
    }

    const [_, tunnelClient] = await createTunnel(tunnelOptions, serverOptions, sshOptions, forwardOptions)
    this.log('Tunnel created. Connection string:')
    this.log(connString)
    const extendInterval = setInterval(async () => {
      await request({
        method: 'POST',
        url: `https://${discoConfig.host}/api/tunnels/${tunnelPort}`,
        discoConfig,
        expectedStatuses: [200],
      })
    }, 60_000)
    process.on('SIGINT', () => {
      clearInterval(extendInterval)
      tunnelClient.destroy()
      request({
        method: 'DELETE',
        url: `https://${discoConfig.host}/api/tunnels/${tunnelPort}`,
        discoConfig,
        expectedStatuses: [200],
      }).then(() => {
        process.exit(0) // eslint-disable-line n/no-process-exit
      })
    })
  }
}
