import {Args, Command, Flags} from '@oclif/core'
import * as dns from 'node:dns'
import fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import {NodeSSH} from 'node-ssh'
import inquirerPassword from '@inquirer/password'
import {addDisco, isDiscoAlreadyInConfig} from '../config'
import cliProgress from 'cli-progress'

export default class Init extends Command {
  static args = {
    sshString: Args.string({required: true}),
  }

  static description = 'initializes a new server'

  static examples = [
    '<%= config.bin %> <%= command.id %> root@12.34.56.78',
    '<%= config.bin %> <%= command.id %> root@12.34.56.78 --version 0.4.0',
  ]

  static flags = {
    version: Flags.string({default: 'latest', description: 'version of disco daemon to install'}),
    verbose: Flags.boolean({default: false, description: 'show extra output'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Init)
    const {version, verbose} = flags
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
    let ssh
    try {
      ssh = await connectSsh({host, username})
    } catch {
      this.error('could not connect to SSH')
    }

    const dockerAlreadyInstalled = await checkDockerInstalled(ssh)
    let progressBar
    if (!verbose) {
      const dockerInstallOutputCount = 309
      const discoInitOutputCount = 261
      const count = dockerAlreadyInstalled ? discoInitOutputCount : dockerInstallOutputCount + discoInitOutputCount
      progressBar = new cliProgress.SingleBar({format: '[{bar}] {percentage}%', clearOnComplete: true})
      progressBar.start(count, 0)
    }
    if (!dockerAlreadyInstalled) {
      if (verbose) {
        this.log('Installing Docker')
      }
      try {
        await installDocker({ssh, verbose, progressBar})
      } catch (err) {
        this.error(`Failed to install Docker\n${err}`)
      }
    } else if (verbose) {
      this.log('Docker already installed')
    }
    if (verbose) {
      this.log('Initializing Disco')
    }
    const {apiKey, certificate} = await initDisco({ssh, ip, version, verbose, progressBar})
    if (verbose) {
      this.log('Adding Disco to local config')
    }
    addDisco(host, host, ip, apiKey, certificate)
    ssh.dispose()
    if (progressBar !== undefined) {
      progressBar.stop()
    }
    this.log('Done')
  }
}

async function getSshPrivateKeyPaths(): Promise<string[]> {
  const sshDir = path.join(os.homedir(), '.ssh')
  const filenames = await fs.readdir(sshDir)
  const publicKeys = filenames.filter((filename) => /^.+\.pub$/.test(filename))
  const possiblePrivKeyPaths = publicKeys
    .map((pubKeyFilename) => pubKeyFilename.slice(0, -4))
    .map((privKeyFilename) => path.join(sshDir, privKeyFilename))
  const privKeyPathsWithIsFile = await Promise.all(
    possiblePrivKeyPaths.map(
      (privKeyPath) =>
        new Promise<{privKeyPath: string; isFile: boolean}>((resolve) => {
          fs.stat(privKeyPath).then((stat) =>
            resolve({
              privKeyPath,
              isFile: stat.isFile(),
            }),
          )
        }),
    ),
  )
  const privKeyPaths = privKeyPathsWithIsFile
    .filter((keyWithIsFile) => keyWithIsFile.isFile)
    .map((keyWithIsFile) => keyWithIsFile.privKeyPath)
  return privKeyPaths
}

async function connectSsh({host, username}: {host: string; username: string}): Promise<NodeSSH> {
  const privKeyPaths = await getSshPrivateKeyPaths()
  const ssh = new NodeSSH()
  for await (const sshKeyPath of privKeyPaths) {
    try {
      await ssh.connect({
        host,
        privateKeyPath: sshKeyPath,
        username,
      })
      return ssh
    } catch {}
  }
  const password = await inquirerPassword({message: `${username}@${host}'s password:`})
  await ssh.connect({
    host,
    username,
    password,
  })
  return ssh
}

async function checkDockerInstalled(ssh: NodeSSH): Promise<boolean> {
  const {code} = await ssh.execCommand('command -v docker >/dev/null 2>&1')
  return code == 0
}

async function installDocker({
  ssh,
  verbose,
  progressBar,
}: {
  ssh: NodeSSH
  verbose: boolean
  progressBar: cliProgress.SingleBar | undefined
}): Promise<void> {
  const commands = [
    'sudo apt-get update',
    'DEBIAN_FRONTEND=noninteractive sudo apt-get install -y ca-certificates curl gnupg',
    'sudo install -m 0755 -d /etc/apt/keyrings',
    'curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg',
    'sudo chmod a+r /etc/apt/keyrings/docker.gpg',
    'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] ' +
      'https://download.docker.com/linux/ubuntu ' +
      '$(. /etc/os-release && echo "$VERSION_CODENAME") stable" | ' +
      'sudo tee /etc/apt/sources.list.d/docker.list > /dev/null',
    'sudo apt-get update',
    'DEBIAN_FRONTEND=noninteractive sudo apt-get install -y docker-ce docker-ce-cli ' +
      'containerd.io docker-buildx-plugin docker-compose-plugin',
  ]
  for (const command of commands) {
    await runSshCommand({ssh, command, verbose, progressBar})
  }
}

async function initDisco({
  ssh,
  ip,
  version,
  verbose,
  progressBar,
}: {
  ssh: NodeSSH
  ip: string
  version: string
  verbose: boolean
  progressBar: cliProgress.SingleBar | undefined
}): Promise<{apiKey: string; certificate: string}> {
  const command =
    'docker run ' +
    '--rm ' +
    '--mount source=disco-data,target=/disco/data ' +
    '--mount type=bind,source=/var/run,target=/host/var/run ' +
    '--mount type=bind,source=/etc,target=/host/etc ' +
    '--mount type=bind,source=$HOME,target=/host/$HOME ' +
    '--mount source=disco-caddy-init-config,target=/initconfig ' +
    '--mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock ' +
    `--env DISCO_IP="${ip}" ` +
    '--env HOST_HOME=$HOME ' +
    '--env DISCO_VERBOSE=true ' +
    `letsdiscodev/daemon:${version} ` +
    'disco_init'
  const output = await runSshCommand({ssh, command, verbose, progressBar})
  const apiKey = extractApiKey(output)
  const certificate = extractPublicKeyCertificate(output)
  return {apiKey, certificate}
}

function extractApiKey(output: string): string {
  const match = output.match(/Created API key: ([a-z0-9]{32})/)
  if (!match) {
    throw new Error('could not extract API key')
  }

  return match[1]
}

function extractPublicKeyCertificate(output: string): string {
  const match = output.match(/-----BEGIN CERTIFICATE-----\n.*\n-----END CERTIFICATE-----/s)
  if (!match) {
    throw new Error('could not extract certificate public key')
  }

  return match[0]
}

async function runSshCommand({
  ssh,
  command,
  verbose,
  progressBar,
}: {
  ssh: NodeSSH
  command: string
  verbose: boolean
  progressBar: cliProgress.SingleBar | undefined
}): Promise<string> {
  let stdout = ''
  let stderr = ''
  const {code} = await ssh.execCommand(command, {
    onStdout(chunk) {
      const str = chunk.toString('utf8')
      stdout += str
      if (verbose) {
        process.stdout.write(str)
      }
      if (progressBar !== undefined) {
        progressBar.increment()
      }
    },
    onStderr(chunk) {
      const str = chunk.toString('utf8')
      stderr += str
      if (verbose) {
        process.stderr.write(str)
      }
      if (progressBar !== undefined) {
        progressBar.increment()
      }
    },
  })
  if (code !== 0) {
    throw new Error(`Failed to run command over SSH\n${command}\n${stderr}`)
  }
  return stdout
}
