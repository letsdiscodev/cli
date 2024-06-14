import {Args, Command, Flags} from '@oclif/core'
import * as dns from 'node:dns'
import fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import * as child from 'node:child_process'
import * as net from 'node:net'
import {NodeSSH} from 'node-ssh'
import inquirerPassword from '@inquirer/password'
import select from '@inquirer/select'
import input from '@inquirer/input'
import {addDisco, isDiscoAlreadyInConfig} from '../config.js'
import {SingleBar} from 'cli-progress'
import {Readable} from 'node:stream'

export default class Init extends Command {
  static args = {
    sshString: Args.string({required: true}),
  }

  static description = 'initializes a new server'

  static examples = [
    '<%= config.bin %> <%= command.id %> root@disco.example.com',
    '<%= config.bin %> <%= command.id %> root@disco.example.com --version 0.4.0',
  ]

  static flags = {
    version: Flags.string({default: 'latest', description: 'version of disco daemon to install'}),
    verbose: Flags.boolean({default: false, description: 'show extra output'}),
    host: Flags.string({
      description:
        'hostname to use, when installing using an internal IP for the SSH connection, e.g. disco init root@10.1.2.3 --host disco.example.com',
    }),
    'local-image': Flags.string({description: 'local Docker image to upload and use (mostly for Disco development)'}),
    'advertise-addr': Flags.string({
      description: 'fixed IP address used to add nodes. defaults to resolving domain name of ssh connection',
    }),
    'cloudflare-tunnel': Flags.string({
      description: 'Cloudflare Tunnel token, if you want to run Disco behind a Cloudflare tunnel',
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Init)
    const {version, verbose, 'local-image': imageFlag, 'advertise-addr': advertiseAddrFlag} = flags
    const image = imageFlag === undefined ? `letsdiscodev/daemon:${version}` : imageFlag
    const [argUsername, sshHost] = args.sshString.split('@')

    // check that sshHost is not an ip address
    if (!flags.host && net.isIP(sshHost)) {
      this.error('host must be a domain name')
    }

    const host = flags.host === undefined ? sshHost : flags.host
    let username = argUsername
    if (isDiscoAlreadyInConfig(host)) {
      this.error('host already present in .disco config')
    }

    let advertiseAddr = advertiseAddrFlag
    if (advertiseAddr === undefined) {
      advertiseAddr = await new Promise<string>((resolve, reject) => {
        dns.lookup(sshHost, (err, address, _) => {
          if (err) {
            reject(err)
          } else {
            resolve(address)
          }
        })
      })
    }

    let ssh
    let password
    try {
      ;({ssh, password} = await connectSsh({host: sshHost, username}))
    } catch {
      this.error('could not connect to SSH')
    }

    if (username !== 'root') {
      const canSudoWithoutPassword = await userCanSudoWitoutPassword({ssh, verbose})
      // use password if provided, or ask for one if needed
      const passwordToUse =
        password === undefined
          ? canSudoWithoutPassword
            ? undefined
            : await inquirerPassword({message: `${username}@${host}'s password:`})
          : password
      if (verbose) {
        if (passwordToUse === undefined) {
          process.stdout.write('Will not use password\n')
        } else {
          process.stdout.write('Will use password\n')
        }
      }

      await setupRootSshAccess({ssh, password: passwordToUse, verbose})
      username = 'root'
      try {
        ;({ssh, password} = await connectSsh({host: sshHost, username}))
      } catch {
        this.error('could not connect to SSH as root')
      }
    }

    const dockerAlreadyInstalled = await checkDockerInstalled(ssh)
    let progressBar
    if (!verbose) {
      const dockerInstallOutputCount = 309
      const discoInitOutputCount = 261
      const count = dockerAlreadyInstalled ? discoInitOutputCount : dockerInstallOutputCount + discoInitOutputCount
      progressBar = new SingleBar({format: '[{bar}] {percentage}%', clearOnComplete: true})
      progressBar.start(count, 0)
    }

    await installDockerIfNeeded({dockerAlreadyInstalled, verbose, ssh, progressBar})

    if (imageFlag !== undefined) {
      await uploadLocalImage({
        image: imageFlag,
        ssh,
        verbose,
      })
    }

    if (verbose) {
      this.log('Initializing Disco')
    }

    const apiKey = await initDisco({
      ssh,
      host,
      advertiseAddr,
      cloudflareTunnel: flags['cloudflare-tunnel'],
      image,
      verbose,
      progressBar,
    })
    if (verbose) {
      this.log('Adding Disco to local config')
    }

    addDisco({name: host, host, apiKey})
    ssh.dispose()
    if (progressBar !== undefined) {
      progressBar.stop()
    }

    this.log('Done')
  }
}

async function uploadLocalImage({image, ssh, verbose}: {image: string; ssh: NodeSSH; verbose: boolean}): Promise<void> {
  if (verbose) {
    process.stdout.write(`Uploading image ${image}\n`)
  }

  const dockerSaveProcess = child.spawn('docker', ['save', image])
  const processCompleted = new Promise<void>((resolve, reject) => {
    dockerSaveProcess.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`docker save ${image} returned code ${code}`))
      }
    })
  })
  await runSshCommand({
    ssh,
    command: 'docker load',
    stdin: dockerSaveProcess.stdout,
    progressBar: undefined,
    verbose,
  })

  await processCompleted
  if (verbose) {
    process.stdout.write('Upload complete\n')
  }
}

async function installDockerIfNeeded({
  dockerAlreadyInstalled,
  verbose,
  ssh,
  progressBar,
}: {
  dockerAlreadyInstalled: boolean
  verbose: boolean
  ssh: NodeSSH
  progressBar: SingleBar | undefined
}): Promise<void> {
  if (!dockerAlreadyInstalled) {
    if (verbose) {
      process.stdout.write('Installing Docker\n')
    }

    try {
      await installDocker({ssh, verbose, progressBar})
    } catch (error) {
      throw new Error(`Failed to install Docker\n${error}`)
    }
  } else if (verbose) {
    process.stdout.write('Docker already installed\n')
  }
}

async function getSshPrivateKeyPaths(): Promise<string[]> {
  const sshDir = path.join(os.homedir(), '.ssh')
  const filenames = await fs.readdir(sshDir)
  const publicKeys = filenames.filter((filename) => filename.endsWith('.pub'))
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

async function connectSsh({
  host,
  username,
  password,
}: {
  host: string
  username: string
  password?: boolean | string | undefined // false means don't try password
}): Promise<{ssh: NodeSSH; password: string | undefined}> {
  // use the ssh-agent, because it makes it so much easier.
  // i.e. it will (usually? always?) find the right key to use, it will
  // deal with keys that have passphrases, etc.
  const sshAuthSocket = process.platform === 'win32' ? 'pageant' : process.env.SSH_AUTH_SOCK
  const ssh = new NodeSSH()
  try {
    await ssh.connect({
      host,
      username,
      agent: sshAuthSocket,
      timeout: 5,
    })
    return {ssh, password: undefined}
  } catch {}

  if (password === undefined) {
    password = await inquirerPassword({message: `${username}@${host}'s password:`})
  }

  if (typeof password === 'string') {
    await ssh.connect({
      host,
      username,
      password,
      timeout: 5,
    })
    return {ssh, password}
  }

  throw new Error('Failed to connect with SSH')
}

async function checkDockerInstalled(ssh: NodeSSH): Promise<boolean> {
  const {code} = await ssh.execCommand('command -v docker >/dev/null 2>&1')
  return code === 0
}

async function installDocker({
  ssh,
  verbose,
  progressBar,
}: {
  ssh: NodeSSH
  verbose: boolean
  progressBar: SingleBar | undefined
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
  for await (const command of commands) {
    await runSshCommand({ssh, command, verbose, progressBar})
  }
}

async function initDisco({
  ssh,
  host,
  advertiseAddr,
  cloudflareTunnel,
  image,
  verbose,
  progressBar,
}: {
  ssh: NodeSSH
  host: string
  advertiseAddr: string
  cloudflareTunnel: string | undefined
  image: string
  verbose: boolean
  progressBar: SingleBar | undefined
}): Promise<string> {
  const command =
    'docker run ' +
    '--rm ' +
    '--mount source=disco-data,target=/disco/data ' +
    '--mount type=bind,source=/var/run,target=/host/var/run ' +
    '--mount type=bind,source=/etc,target=/host/etc ' +
    '--mount type=bind,source=$HOME,target=/host/$HOME ' +
    '--mount source=disco-caddy-init-config,target=/initconfig ' +
    '--mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock ' +
    `--env DISCO_HOST="${host}" ` +
    `--env DISCO_ADVERTISE_ADDR="${advertiseAddr}" ` +
    '--env HOST_HOME=$HOME ' +
    `--env DISCO_IMAGE=${image} ` +
    (cloudflareTunnel === undefined ? '' : `--env CLOUDFLARE_TUNNEL_TOKEN=${cloudflareTunnel} `) +
    `${image} ` +
    'disco_init'
  const output = await runSshCommand({ssh, command, verbose, progressBar})
  const apiKey = extractApiKey(output)
  return apiKey
}

function extractApiKey(output: string): string {
  const match = output.match(/Created API key: ([a-z0-9]{32})/)
  if (!match) {
    throw new Error('could not extract API key')
  }

  return match[1]
}

async function runSshCommand({
  ssh,
  command,
  stdin,
  verbose,
  progressBar,
}: {
  ssh: NodeSSH
  command: string
  stdin?: Readable | string
  verbose: boolean
  progressBar: SingleBar | undefined
}): Promise<string> {
  let stdout = ''
  let stderr = ''
  if (verbose) {
    process.stdout.write(`$ ${command}\n`)
  }

  const {code} = await ssh.execCommand(command, {
    stdin,
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

async function userCanSudoWitoutPassword({ssh, verbose}: {ssh: NodeSSH; verbose: boolean}): Promise<boolean> {
  try {
    await runSshCommand({ssh, command: 'sudo -n true', verbose, progressBar: undefined})
    if (verbose) {
      process.stdout.write('Can run sudo commands without password\n')
    }

    return true
  } catch {
    if (verbose) {
      process.stdout.write('Sudo commands require password\n')
    }

    return false
  }
}

async function setupRootSshAccess({
  ssh,
  verbose,
  password,
}: {
  ssh: NodeSSH
  verbose: boolean
  password: string | undefined
}) {
  const permitRootLogin = await readPermitRootLogin({ssh, verbose})
  if (permitRootLogin === null) {
    // no statement set, add one
    await addPermitRootLoginProhibitPassword({ssh, password, verbose})
  } else if (!['nopwd', 'prohibit-password', 'without-password', 'yes'].includes(permitRootLogin)) {
    // currently explicitly not permissive enough
    // allow SSH root login with private key
    await updatePermitRootLoginToProhibitPassword({ssh, password, verbose})
  }

  await uploadRootSshPublicKey({ssh, verbose, password})
  await restartSshD({ssh, verbose, password})
  ssh.dispose()
}

async function readPermitRootLogin({ssh, verbose}: {ssh: NodeSSH; verbose: boolean}): Promise<null | string> {
  try {
    const statement = await runSshCommand({
      ssh,
      command: 'cat /etc/ssh/sshd_config | grep PermitRootLogin',
      verbose,
      progressBar: undefined,
    })
    if (statement.startsWith('PermitRootLogin')) {
      return statement.split(' ')[1]
    }
  } catch {
    // the grep did not return any results, so it won't exit with a code 0
    // assume that it didn't work, return null
    return null
  }

  return null
}

async function updatePermitRootLoginToProhibitPassword({
  ssh,
  password,
  verbose,
}: {
  ssh: NodeSSH
  password: string | undefined
  verbose: boolean
}): Promise<void> {
  await runSshCommand({
    ssh,
    command: `sudo ${
      password === undefined ? ' ' : '-S '
    }sed -i '0,/^PermitRootLogin/c\\PermitRootLogin prohibit-password' /etc/ssh/sshd_config`,
    verbose,
    stdin: password,
    progressBar: undefined,
  })
}

async function addPermitRootLoginProhibitPassword({
  ssh,
  password,
  verbose,
}: {
  ssh: NodeSSH
  password: string | undefined
  verbose: boolean
}): Promise<void> {
  await runSshCommand({
    ssh,
    command: `sudo ${
      password === undefined ? ' ' : '-S '
    } sh -c "echo 'PermitRootLogin prohibit-password' >> /etc/ssh/sshd_config"`,
    verbose,
    stdin: password,
    progressBar: undefined,
  })
}

async function uploadRootSshPublicKey({
  ssh,
  verbose,
  password,
}: {
  ssh: NodeSSH
  verbose: boolean
  password: string | undefined
}): Promise<void> {
  const privKeyPaths = await getSshPrivateKeyPaths()
  const selectedPrivKeyName = await select({
    message: 'Select SSH key to setup for root access',
    choices: [
      ...privKeyPaths.map((keyPath) => ({
        name: keyPath,
        value: keyPath,
      })),
      {
        name: 'Create a new one',
        value: '__NEW__',
      },
    ],
  })
  let localPublicKeyPath: string
  if (selectedPrivKeyName === '__NEW__') {
    const idRsaExists = privKeyPaths.filter((keyPath) => keyPath.endsWith(`${path.sep}id_rsa`))
    const defaultKeyName = idRsaExists ? `id_rsa_disco_${Math.floor(Math.random() * 9_999_999)}` : 'id_rsa'
    const privKeyName = await input({message: 'Enter the name of the new key to create', default: defaultKeyName})
    const localPrivKeyPath = path.join(os.homedir(), '.ssh', privKeyName)
    localPublicKeyPath = `${localPrivKeyPath}.pub`
    await new Promise<void>((resolve, reject) => {
      child.exec(`ssh-keygen -f ${localPrivKeyPath} -N ""`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error('Error running ssh-keygen'))
        }

        if (verbose) {
          process.stdout.write(stdout)
          process.stderr.write(stderr)
        }

        resolve()
      })
    })
  } else {
    localPublicKeyPath = `${selectedPrivKeyName}.pub`
  }

  const publicKeyContent = await fs.readFile(localPublicKeyPath)
  await runSshCommand({
    ssh,
    command: `sudo ${password === undefined ? ' ' : '-S '}mkdir -p /root/.ssh`,
    verbose,
    stdin: password,
    progressBar: undefined,
  })
  await runSshCommand({
    ssh,
    command: `sudo ${password === undefined ? ' ' : '-S '}touch /root/.ssh/authorized_keys`,
    verbose,
    stdin: password,
    progressBar: undefined,
  })
  let keyAlreadyAuthorized
  try {
    await runSshCommand({
      ssh,
      command: `sudo ${
        password === undefined ? ' ' : '-S '
      }sh -c "cat /root/.ssh/authorized_keys | grep '${publicKeyContent}'"`,
      verbose,
      stdin: password,
      progressBar: undefined,
    })
    keyAlreadyAuthorized = true
  } catch {
    keyAlreadyAuthorized = false
  }

  if (!keyAlreadyAuthorized) {
    await runSshCommand({
      ssh,
      command: `sudo ${
        password === undefined ? ' ' : '-S '
      }sh -c "echo '${publicKeyContent}' >> /root/.ssh/authorized_keys"`,
      verbose,
      stdin: password,
      progressBar: undefined,
    })
  }
}

async function restartSshD({
  ssh,
  verbose,
  password,
}: {
  ssh: NodeSSH
  verbose: boolean
  password: string | undefined
}): Promise<void> {
  await runSshCommand({
    ssh,
    command: `sudo ${password === undefined ? ' ' : '-S '}/etc/init.d/ssh restart`,
    stdin: password,
    verbose,
    progressBar: undefined,
  })
}
