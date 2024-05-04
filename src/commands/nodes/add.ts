import {Args, Command, Flags} from '@oclif/core'

import {getDisco} from '../../config'
import {request} from '../../auth-request'

import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import {NodeSSH} from 'node-ssh'

const GET_NODE_SCRIPT_URL = (version: string) => `https://downloads.letsdisco.dev/${version}/node`

export default class NodesAdd extends Command {
  static override args = {
    sshString: Args.string({description: 'ssh user@IP to connect to new machine', required: true}),
  }

  static override description = 'add a new server to your deployment'

  static override examples = ['<%= config.bin %> <%= command.id %> root@12.34.56.78']

  static override flags = {
    disco: Flags.string({required: false}),
    version: Flags.string({required: false, default: 'latest'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(NodesAdd)
    const discoConfig = getDisco(flags.disco || null)
    // eslint-disable-next-line new-cap
    const nodeScriptUrl = GET_NODE_SCRIPT_URL(flags.version)

    const url = `https://${discoConfig.host}/api/disco/swarm/join-token`
    const res = await request({
      method: 'GET',
      url,
      discoConfig,
    })
    const data = await res.json()

    const token = data.joinToken
    const {ip} = data
    const command = `curl ${nodeScriptUrl} | sudo IP=${ip} TOKEN=${token} sh`

    // TODO centralize this code which is identical to code in init.ts

    const [username, host] = args.sshString.split('@')

    const sshKeyPaths = [
      path.join(os.homedir(), '.ssh', 'id_ed25519'),
      path.join(os.homedir(), '.ssh', 'id_rsa'),
    ].filter((p) => {
      try {
        return fs.statSync(p).isFile()
      } catch {
        return false
      }
    })

    if (sshKeyPaths.length === 0) {
      this.error('could not find an SSH key in ~/.ssh')
    }

    const ssh = new NodeSSH()

    let connected = false
    for await (const sshKeyPath of sshKeyPaths) {
      try {
        await ssh.connect({
          host,
          privateKeyPath: sshKeyPath,
          username,
        })
        connected = true
        break
      } catch {
        // skip error
      }
    }

    if (!connected) {
      this.error('could not connect to server')
    }

    this.log('connected')

    // do something with stderr output?
    const {code} = await ssh.execCommand(command, {
      onStdout(chunk) {
        const str = chunk.toString('utf8')
        process.stdout.write(str)
      },
    })
    if (code !== 0) {
      this.error('failed to run ssh script')
    }

    ssh.dispose()
  }
}
