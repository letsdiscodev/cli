import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../../config.js'
import {request, readEventSource} from '../../../auth-request.js'

export default class PostgresInstancesAdd extends Command {
  static description = 'add a Postgres instance'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PostgresInstancesAdd)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/postgres-addon/cgi/endpoints/instances`
    const res = await request({
      method: 'POST',
      url,
      discoConfig,
      expectedStatuses: [201],
      extraHeaders: {
        'X-Disco-Include-API-Key': 'true',
      },
    })
    const respBody = (await res.json()) as {project: {name: string}; deployment: {number: number}}
    this.log(`Added instance ${respBody.project.name}`)
    const deploymentUrl = `https://${discoConfig.host}/api/projects/${respBody.project.name}/deployments/${respBody.deployment.number}/output`

    readEventSource(deploymentUrl, discoConfig, {
      onMessage(event: MessageEvent) {
        process.stdout.write(JSON.parse(event.data).text)
      },
    })
  }
}
