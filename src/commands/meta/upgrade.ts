import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

interface UpgradeParams {
  pull: boolean
  image?: string
}

async function getTheCurrentVersion(discoConfig: any) {
  const url = `https://${discoConfig.host}/api/disco/meta`
  const res = await request({method: 'GET', url, discoConfig})
  const data = (await res.json()) as any
  return data.version
}

export default class MetaUpgrade extends Command {
  static description = 'upgrade server'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    image: Flags.string({required: false, description: 'the image to use. Defaults to letsdiscodev/daemon:latest'}),
    'dont-pull': Flags.boolean({required: false, description: "don't pull the image before upgrading"}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(MetaUpgrade)

    const discoConfig = getDisco(flags.disco || null)

    const currentVersion = await getTheCurrentVersion(discoConfig)

    const url = `https://${discoConfig.host}/api/disco/upgrade`

    const body: UpgradeParams = {
      pull: !flags['dont-pull'],
    }
    if (flags.image) {
      body.image = flags.image
    }

    this.log('Starting upgrade...')

    request({method: 'POST', url, discoConfig, body})
      .then(() => {
        this.log(`Current version: ${currentVersion}`)
        this.log('Upgrade in progress...')
        this.log('Check status with "disco meta:info"')
      })
      .catch((error) => {
        this.warn(error?.message ?? 'An error occurred')
      })
  }
}
