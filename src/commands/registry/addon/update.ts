import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../../config.js'
import {request, readEventSource} from '../../../auth-request.js'

const addonProjectName = 'addon-registry';

export default class RegistryAddonUpdate extends Command {
  static description = 'update Registry addon'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(RegistryAddonUpdate)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/${addonProjectName}/deployments`
    const res = await request({method: 'POST', url, body: {}, discoConfig, expectedStatuses: [201]})
    const data = (await res.json()) as any

    const deploymentUrl = `https://${discoConfig.host}/api/projects/${addonProjectName}/deployments/${data.deployment.number}/output`
    await readEventSource(deploymentUrl, discoConfig, {
      onMessage(event: MessageEvent) {
        const message = JSON.parse(event.data)
        process.stdout.write(message.text)
      },
    })
  }
}
