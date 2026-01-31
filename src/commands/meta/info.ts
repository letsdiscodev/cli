import {Command, Flags} from '@oclif/core'

import {request} from '../../auth-request.js'
import {getDisco} from '../../config.js'

export interface MetaResponse {
  version: string
  discoHost: null | string
  registryHost: null | string
  publicKey: string
  docker: {
    version: string
  }
}

export default class MetaInfo extends Command {
  static description = 'fetch info about the server'

  static enableJsonFlag = true

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<MetaResponse> {
    const {flags} = await this.parse(MetaInfo)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/disco/meta`

    const res = await request({method: 'GET', url, discoConfig})
    const data = (await res.json()) as MetaResponse
    this.log(`Version:         ${data.version}`)
    this.log(`Disco Host:      ${data.discoHost}`)
    this.log(`Registry Host:   ${data.registryHost}`)

    return data
  }
}
