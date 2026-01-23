import {Args, Command, Flags} from '@oclif/core'
import {NodeSSH} from 'node-ssh'
import {password as inquirerPassword} from '@inquirer/prompts'
import {SingleBar} from 'cli-progress'
import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'
import {
  checkDockerInstalled,
  connectSsh,
  installDockerIfNeeded,
  runSshCommand,
  setupRootSshAccess,
  userCanSudoWitoutPassword,
} from '../init.js'

export default class NodesAdd extends Command {
  static args = {
    sshString: Args.string({required: true}),
  }

  static description = 'initializes a new server'

  static examples = [
    '<%= config.bin %> <%= command.id %> root@disco.example.com',
    '<%= config.bin %> <%= command.id %> root@disco.example.com --version 0.4.0',
  ]

  static flags = {
    verbose: Flags.boolean({default: false, description: 'show extra output'}),
    'identity-file': Flags.string({
      char: 'i',
      description: 'SSH key to use for authentication',
    }),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(NodesAdd)
    const {verbose, 'identity-file': identityFile, disco} = flags

    const discoConfig = getDisco(disco || null)

    const url = `https://${discoConfig.host}/api/disco/swarm/join-token`
    const res = await request({
      method: 'GET',
      url,
      discoConfig,
    })
    const {
      joinToken,
      ip: leaderIp,
      dockerVersion,
      registryHost,
    } = (await res.json()) as {
      joinToken: string
      ip: string
      dockerVersion: string
      registryHost: null | string
    }

    if (registryHost === null) {
      this.log('Image registry not configured')
      this.log('See disco registries command. For example:')
      this.log(`disco registries:login ghcr.io --username myuser --disco ${discoConfig.name}`)
      this.log(`disco registries:set ghcr.io/myuser --disco ${discoConfig.name}`)
      return
    }

    const [argUsername, host] = args.sshString.split('@')

    let username = argUsername

    let ssh
    let password
    try {
      ;({ssh, password} = await connectSsh({host, username, identityFile}))
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
        ;({ssh, password} = await connectSsh({host, username, identityFile}))
      } catch {
        this.error('could not connect to SSH as root')
      }
    }

    const dockerAlreadyInstalled = await checkDockerInstalled(ssh)
    let progressBar
    if (!verbose) {
      const dockerInstallOutputCount = 309
      const count = dockerAlreadyInstalled ? 0 : dockerInstallOutputCount
      progressBar = new SingleBar({format: '[{bar}] {percentage}%', clearOnComplete: true})
      progressBar.start(count, 0)
    }

    await installDockerIfNeeded({dockerAlreadyInstalled, verbose, ssh, dockerVersion, progressBar})

    if (verbose) {
      this.log('Joining Swarm')
    }

    await joinSwarm({
      ssh,
      joinToken,
      leaderIp,
      verbose,
      progressBar,
    })

    ssh.dispose()
    if (progressBar !== undefined) {
      progressBar.stop()
    }

    this.log('Done')
  }
}

async function joinSwarm({
  ssh,
  joinToken,
  leaderIp,
  verbose,
  progressBar,
}: {
  ssh: NodeSSH
  joinToken: string
  leaderIp: string
  verbose: boolean
  progressBar: SingleBar | undefined
}): Promise<void> {
  const command = `docker swarm join --token ${joinToken} ${leaderIp}:2377`
  await runSshCommand({ssh, command, verbose, progressBar})
}
