import {Command, Flags} from '@oclif/core'

import {readEventSource, request} from '../../auth-request.js'
import {getDisco} from '../../config.js'
import {ProjectCreateResponse} from './addon/install.js'

type PostgresInstance = {
  name: string
  version: string
  created: string
}

type PostgresDatabase = {
  created: string
  name: string
}

export default class PostgresCreate extends Command {
  static description = 'create a database for a project, ensuring addon and instance are installed'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
    project: Flags.string({required: true}),
    'env-var': Flags.string({required: true, default: 'DATABASE_URL'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PostgresCreate)
    const discoConfig = getDisco(flags.disco || null)
    let instances: PostgresInstance[] | undefined
    let instanceName: string | undefined
    {
      // get list of instances
      const url = `https://${discoConfig.host}/api/projects/postgres-addon/cgi/endpoints/instances`
      const res = await request({
        method: 'GET',
        url,
        discoConfig,
        expectedStatuses: [200, 404],
        extraHeaders: {
          'X-Disco-Include-API-Key': 'true',
        },
      })
      if (res.status === 200) {
        const respBody = (await res.json()) as {instances: PostgresInstance[]}
        instances = respBody.instances
      } else {
        // res.status == 404
        this.log('Postgres addon not installed. Installing.')
        const url = `https://${discoConfig.host}/api/projects`
        const project = 'postgres-addon'
        const body = {
          name: project,
          githubRepo: 'letsdiscodev/disco-addon-postgres',
        }

        const res = await request({method: 'POST', url, discoConfig, body, expectedStatuses: [201]})
        const data = (await res.json()) as ProjectCreateResponse
        if (data.deployment) {
          const url = `https://${discoConfig.host}/api/projects/${project}/deployments/${data.deployment.number}/output`
          await readEventSource(url, discoConfig, {
            onMessage(event: MessageEvent) {
              process.stdout.write(JSON.parse(event.data).text)
            },
          })
        }

        instances = []
      }
    }

    if (instances.length === 0) {
      this.log('No Postgres instance yet. Adding one.')
      const url = `https://${discoConfig.host}/api/projects/postgres-addon/cgi/endpoints/instances`
      const reqBody = {
        // disco will set these to sensible defaults
        // ie postgres 17.2 as of this writing
        image: null,
        version: null,
      }
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
      this.log(`Added instance ${respBody.instance.name}.`)
      const deploymentUrl = `https://${discoConfig.host}/api/projects/${respBody.project.name}/deployments/${respBody.deployment.number}/output`

      await readEventSource(deploymentUrl, discoConfig, {
        onMessage(event: MessageEvent) {
          process.stdout.write(JSON.parse(event.data).text)
        },
      })
      instanceName = respBody.instance.name
    } else {
      instances.sort((a, b) => new Date(a.created).valueOf() - new Date(b.created).valueOf())
      instanceName = instances.at(-1)?.name
      this.log(`Using Postgres instance ${instanceName}.`)
    }

    let databaseName: string | undefined
    {
      this.log('Creating database.')
      const url = `https://${discoConfig.host}/api/projects/postgres-addon/cgi/endpoints/instances/${instanceName}/databases`
      const res = await request({
        method: 'POST',
        url,
        discoConfig,
        expectedStatuses: [201],
        extraHeaders: {
          'X-Disco-Include-API-Key': 'true',
        },
      })
      const respBody = (await res.json()) as {database: PostgresDatabase}
      this.log(respBody.database.name)
      databaseName = respBody.database.name
    }

    {
      this.log('Attaching database to project.')
      const url = `https://${discoConfig.host}/api/projects/postgres-addon/cgi/endpoints/instances/${instanceName}/databases/${databaseName}/attach`
      const reqBody = {envVar: flags['env-var'], project: flags.project}
      await request({
        method: 'POST',
        url,
        discoConfig,
        body: reqBody,
        expectedStatuses: [200],
        extraHeaders: {
          'X-Disco-Include-API-Key': 'true',
        },
      })
    }
  }
}
