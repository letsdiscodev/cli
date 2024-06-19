import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'
import {createTunnel} from 'tunnel-ssh'
import {AddressInfo, createServer} from 'node:net'

async function portIsAvailable(port: number): Promise<boolean> {
  const isAvailable = await new Promise<boolean>((resolve) => {
    const server = createServer()
    server.once('error', (err: {code: string}) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false) // not available
      }
    })

    server.once('listening', () => {
      // close the server if listening doesn't fail
      server.close()
      resolve(true)
    })

    server.listen(port)
  })

  return isAvailable
}

async function localPort(portFlag: number | undefined): Promise<number | undefined> {
  if (portFlag === undefined) {
    const portInUse = !(await portIsAvailable(5432))
    if (portInUse) {
      // port in use, let OS pick another port
      return undefined
    } else {
      // port available, use default Postgres port
      return 5432
    }
  } else {
    // port specified as CLI arg
    return portFlag
  }
}

export default class PostgresTunnel extends Command {
  static description = 'create a temporary tunnel to access Postgres through localhost'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
    project: Flags.string({required: true}),
    'env-var': Flags.string({required: false}),
    port: Flags.integer({required: false}),
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

    const tunnelOptions = {
      // do not close tunnel when third party app disconnects
      autoClose: false, 
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
    this.log('Tunnel created. Connection string:')
    const {port} = tunnelServer.address() as AddressInfo
    const connString = `postgresql://${dbInfo.user}:${dbInfo.password}@localhost:${port}/${dbInfo.database}`
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
