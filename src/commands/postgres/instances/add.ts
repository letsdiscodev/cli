import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../../config.js'
import {request, readEventSource} from '../../../auth-request.js'

export default class PostgresInstancesAdd extends Command {
  static description = 'add a Postgres instance'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --image postgres --version 16.3',
    '<%= config.bin %> <%= command.id %> --image postgis/postgis --version 17-3.5',
  ]

  static flags = {
    image: Flags.string({
      required: false,
      description: 'the Docker image to use, without the tag',
    }),
    version: Flags.string({
      required: false,
      description: 'the tag to use for the Docker image',
    }),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PostgresInstancesAdd)
    const reqBody = {
      image: flags.image,
      version: flags.version,
    }
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/postgres-addon/cgi/endpoints/instances`
    const res = await request({
      method: 'POST',
      body: reqBody,
      url,
      discoConfig,
      expectedStatuses: [201],
      extraHeaders: {
        'X-Disco-Include-API-Key': 'true',
      },
    })
    const respBody = (await res.json()) as {
      instance: {name: string}
      project: {name: string}
      deployment: {number: number}
    }
    this.log(`Added instance ${respBody.instance.name}`)
    const deploymentUrl = `https://${discoConfig.host}/api/projects/${respBody.project.name}/deployments/${respBody.deployment.number}/output`

    readEventSource(deploymentUrl, discoConfig, {
      onMessage(event: MessageEvent) {
        process.stdout.write(JSON.parse(event.data).text)
      },
    })
  }
}
