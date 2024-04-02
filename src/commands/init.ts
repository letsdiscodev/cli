import {Args, Command, Flags} from '@oclif/core'
import * as dns from 'node:dns'
import * as os from 'node:os'
import * as path from 'node:path'
import {NodeSSH} from 'node-ssh'

export default class Init extends Command {
  static args = {
    sshString: Args.string({required: true}),
  }

  static description = 'initializes a new server'

  static examples = ['<%= config.bin %> <%= command.id %> root@12.34.56.78']

  static flags = {
    version: Flags.string({default: 'latest', description: 'version of disco daemon to install'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Init)

    // TODO validate that args look like user@host
    // (host can only be IP... I think??)
    const [username, host] = args.sshString.split('@')

    // get ip via dns lookup
    const ip = await new Promise((resolve, reject) => {
      dns.lookup(host, (err, address, _) => {
        if (err) {
          reject(err)
        } else {
          resolve(address)
        }
      })
    })

    const initScriptUrl = `https://downloads.letsdisco.dev/${flags.version}/init`

    const ssh = new NodeSSH()
    await ssh.connect({
      host,
      // TODO try both id_rsa and id_ed25519 ??
      privateKeyPath: path.join(os.homedir(), '.ssh', 'id_ed25519'),
      username,
    })

    this.log('connected')

    const command = `curl ${initScriptUrl} | sudo DISCO_IP=${ip} DISCO_VERBOSE='false' sh`
    await ssh.execCommand(command, {
      onStderr: (chunk) => {
        this.log(chunk.toString('utf8'))
      },
      onStdout: (chunk) => {
        this.log(chunk.toString('utf8'))
      },
    })

    ssh.dispose()
  }
}
