import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config'
import {request} from '../../auth-request'

interface UpgradeParams {
  pull: boolean
  image?: string
}

export default class MetaUpgrade extends Command {
  static description = 'upgrade server'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    image: Flags.string({required: false, description: 'the image to use. Defaults to letsdiscodev/daemon:latest'}),
    dontPull: Flags.boolean({required: false, description: "don't pull the image before upgrading"}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(MetaUpgrade)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/.disco/disco/upgrade`

    const body: UpgradeParams = {
      pull: !flags.dontPull,
    }
    if (flags.image) {
      body.image = flags.image
    }

    request({method: 'POST', url, discoConfig, body})
      .then(() => {
        this.log(`Upgrade started`)
      })
      .catch((error) => {
        this.warn(error?.message ?? 'An error occurred')
      })
  }
}
