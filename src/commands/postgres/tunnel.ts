import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'
import {createTunnel, TunnelOptions} from 'tunnel-ssh'
import {AddressInfo} from 'node:net'
import {detect} from 'detect-port'

async function portIsAvailable(port: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    detect(port)
      .then((realPort) => {
        resolve(realPort === port)
      })
      .catch((error) => {
        reject(error)
      })
  })
}

async function localPort(portFlag: number | undefined): Promise<number | undefined> {
  if (portFlag === undefined) {
    // prefer 5432, but if in use, let OS pick a port
    const portInUse = !(await portIsAvailable(5432))
    return portInUse ? undefined : 5432
  }

  // port specified as CLI arg, use it
  return portFlag
}

export default class PostgresTunnel extends Command {
  static description = 'create a temporary tunnel to access Postgres through localhost'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
    project: Flags.string({required: true}),
    'env-var': Flags.string({required: false}),
    port: Flags.integer({required: false}),
    'super-user': Flags.boolean({default: false, description: 'connect as super user instead of database owner'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PostgresTunnel)
    const discoConfig = getDisco(flags.disco || null)
    if (flags.port !== undefined && !(await portIsAvailable(flags.port))) {
      this.error(`Port ${flags.port} already in use`)
    }

    const dbInfoUrl = `https://${discoConfig.host}/api/projects/postgres-addon/cgi/endpoints/tunnels`
    const dbInfoResponse = await request({
      method: 'POST',
      url: dbInfoUrl,
      body: {
        project: flags.project,
        envVar: flags['env-var'],
        superUser: flags['super-user'],
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

    const tunnelOptions: TunnelOptions = {
      // do not close tunnel when third party app disconnects
      autoClose: false,
      reconnectOnError: false,
    }

    const serverOptions = {
      host: 'localhost',
      port: await localPort(flags.port),
    }

    // check again now that sshd container is ready
    if (flags.port !== undefined && !(await portIsAvailable(flags.port))) {
      this.error(`Port ${flags.port} already in use`)
    }

    const [tunnelServer, tunnelClient] = await createTunnel(tunnelOptions, serverOptions, sshOptions, forwardOptions)
    tunnelServer.on('connection', (socket) => {
      socket.on('error', () => {
        // swallow error
        // instead of crashing on errors like ECONNRESET
      })
    })
    this.log('Tunnel created!')
    this.log('')
    this.log('Connection string:')
    const {port} = tunnelServer.address() as AddressInfo
    const connString = `postgresql://${dbInfo.user}:${dbInfo.password}@localhost:${port}/${dbInfo.database}`
    this.log(connString)
    this.log('')
    this.log('Press Ctrl+C to close the tunnel')
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
