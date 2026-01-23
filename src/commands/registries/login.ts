import {Args, Command, Flags} from '@oclif/core'
import {password as inquirerPassword} from '@inquirer/prompts'
import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export default class RegistriesLogin extends Command {
  static args = {
    address: Args.string({required: true, description: 'registry address, e.g. ghcr.io'}),
  }

  static description = `log in to a container registry

docker login, for Disco.`

  static examples = [
    '<%= config.bin %> <%= command.id %> ghcr.io --username myuser',
    '<%= config.bin %> <%= command.id %> ghcr.io --username myuser --password-stdin < token.txt',
    'echo $GITHUB_TOKEN | <%= config.bin %> <%= command.id %> ghcr.io --username myuser --password-stdin',
  ]

  static flags = {
    username: Flags.string({
      required: true,
      description: 'the username to use for login',
    }),
    'password-stdin': Flags.boolean({
      default: false,
      description: 'read password from stdin',
    }),
    disco: Flags.string({required: false, description: 'server to use'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(RegistriesLogin)
    const discoConfig = getDisco(flags.disco || null)

    const password = await (flags['password-stdin']
      ? this.readPasswordFromStdin()
      : inquirerPassword({message: 'Password:'}))

    const url = `https://${discoConfig.host}/api/disco/registries`
    const body = {
      address: args.address,
      username: flags.username,
      password,
    }
    await request({method: 'POST', url, discoConfig, body, expectedStatuses: [200]})
    this.log(`Logged in to ${args.address}`)
  }

  private async readPasswordFromStdin(): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = ''
      process.stdin.setEncoding('utf8')
      process.stdin.on('data', (chunk) => {
        data += chunk
      })
      process.stdin.on('end', () => {
        resolve(data.trim())
      })
      process.stdin.on('error', reject)
    })
  }
}
