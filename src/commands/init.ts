import {Args, Command, Flags} from '@oclif/core'
import * as dns from 'node:dns'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import {NodeSSH} from 'node-ssh'

import {addDisco, isDiscoAlreadyInConfig} from '../config'

const getInitScriptUrl = (version: string) => `https://downloads.letsdisco.dev/${version}/init`

export function extractApiKey(output: string): string {
  const match = output.match(/Created API key: ([a-z0-9]{32})/)
  if (!match) {
    throw new Error('could not extract API key')
  }

  return match[1]
}

export function extractPublicKeyCertificate(output: string): string {
  const match = output.match(/-----BEGIN CERTIFICATE-----\n.*\n-----END CERTIFICATE-----/s)
  if (!match) {
    throw new Error('could not extract certificate public key')
  }

  return match[0]
}

export default class Init extends Command {
  static args = {
    sshString: Args.string({required: true}),
  }

  static description = 'initializes a new server'

  static examples = [
    '<%= config.bin %> <%= command.id %> root@12.34.56.78',
    '<%= config.bin %> <%= command.id %> root@12.34.56.78 --version 0.4.0.dev2',
  ]

  static flags = {
    version: Flags.string({default: 'latest', description: 'version of disco daemon to install'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Init)

    const [username, host] = args.sshString.split('@')

    if (isDiscoAlreadyInConfig(host)) {
      this.error('host already present in .disco config')
    }

    // make sure that host is an IP address, otherwise fail.
    // validate ipv4 addresses only for now
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
      this.error('ssh host must be an IP address, not a domain name')
    }

    // get ip via dns lookup
    // (we only accept IPs for now, but that's because there seems to be a bug
    // when running init with a domain name for a host. if/when that bug is fixed,
    // we'll probably want to do the dns lookup below. so keep it for now.)
    // https://github.com/letsdiscodev/disco-daemon/issues/3
    const ip: string = await new Promise((resolve, reject) => {
      dns.lookup(host, (err, address, _) => {
        if (err) {
          reject(err)
        } else {
          resolve(address)
        }
      })
    })

    if (!ip) {
      this.error('could not resolve IP address for host')
    }

    const initScriptUrl = getInitScriptUrl(flags.version)

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

    let allOutputChunks = ''
    const command = `curl ${initScriptUrl} | sudo DISCO_IP=${ip} DISCO_VERBOSE='false' sh`

    // do something with stderr output?
    const {code} = await ssh.execCommand(command, {
      onStdout(chunk) {
        const str = chunk.toString('utf8')
        allOutputChunks += str
        process.stdout.write(str)
      },
    })
    if (code !== 0) {
      this.error('failed to run init script')
    }

    ssh.dispose()

    const apiKey = extractApiKey(allOutputChunks)
    const certificate = extractPublicKeyCertificate(allOutputChunks)

    addDisco(host, host, ip, apiKey, certificate)

    this.log('done!')
  }
}
