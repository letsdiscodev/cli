import {Command, Flags} from '@oclif/core'

import {getDisco} from '../../config'
import {request} from '../../auth-request'

export default class ApikeysList extends Command {
  static override description = 'list all api keys'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  static override flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ApikeysList)
    const discoConfig = getDisco(flags.disco || null)

    const url = `https://${discoConfig.host}/api/api-keys`
    const res = await request({method: 'GET', url, discoConfig})
    const data = await res.json()
    this.log('Public                           Private                          Name')
    for (const key of data.apiKeys) {
      this.log(`${key.publicKey} ${key.privateKey} ${key.name}`)
    }
  }
}
