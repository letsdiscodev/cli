import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../../config.js'
import {request, readEventSource} from '../../../auth-request.js'

export default class PostgresAddonInstall extends Command {
  static description = 'install Postgres addon'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PostgresAddonInstall)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects`
    const project = 'postgres-addon';
    const body = {
      name: project,
      githubRepo: 'letsdiscodev/disco-addon-postgres',
    }

    const res = await request({method: 'POST', url, discoConfig, body, expectedStatuses: [201]})
    const data = (await res.json()) as any
    if (data.deployment) {
      const url = `https://${discoConfig.host}/api/projects/${project}/deployments/${data.deployment.number}/output`

      readEventSource(url, discoConfig, {
        onMessage(event: MessageEvent) {
          process.stdout.write(JSON.parse(event.data).text)
        },
      })
    }
  }
}
