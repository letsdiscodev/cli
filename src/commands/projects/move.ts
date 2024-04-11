import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config'
import {request, readEventSource} from '../../auth-request'

interface ProjectExport {
  name: string
  githubRepo: string
  domain: string
  githubWebhookToken: string
  ssh: string
  envVariables: string
  caddy: string
  deployment: {
    commit: string
    number: number
  }
}

export default class ProjectsMove extends Command {
  static override description = 'move a project from one server to another'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --project mysite --from-disco 10.1.1.1 --to-disco 10.2.2.2',
  ]

  static override flags = {
    project: Flags.string({required: true, description: 'project name'}),
    'from-disco': Flags.string({required: true, description: 'source disco server'}),
    'to-disco': Flags.string({required: true, description: 'destination disco server'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ProjectsMove)

    // export
    const fromDiscoConfig = getDisco(flags['from-disco'])
    const toDiscoConfig = getDisco(flags['to-disco'])

    const exportUrl = `https://${fromDiscoConfig.host}/.disco/projects/${flags.project}/export`

    const exportResponse = await request({method: 'GET', url: exportUrl, discoConfig: fromDiscoConfig})
    const exportResult: ProjectExport = await exportResponse.json()

    // create project
    const createUrl = `https://${toDiscoConfig.host}/.disco/projects`

    // TODO check that exportResult.deployment.commit exists
    // otherwise, it could mean that the project that's being
    // moved has never been deployed before

    const createBody = {
      name: exportResult.name,
      githubRepo: exportResult.githubRepo,
      domain: exportResult.domain,
      githubWebhookToken: exportResult.githubWebhookToken,
      ssh: exportResult.ssh,
      envVariables: exportResult.envVariables,
      caddy: exportResult.caddy,
      commit: exportResult.deployment.commit,
      deploymentNumber: exportResult.deployment.number + 1,
      deploy: true,
    }

    const createResponse = await request({
      method: 'POST',
      url: createUrl,
      discoConfig: toDiscoConfig,
      body: createBody,
      expectedStatuses: [201],
    })
    const createResult = await createResponse.json()

    if (createResult.deployment) {
      this.log(`Deploying ${flags.project}, version ${createResult.deployment.number}`)

      const outputStream = `https://${toDiscoConfig.host}/.disco/projects/${flags.project}/deployments/${createResult.deployment.number}/output`

      readEventSource(outputStream, toDiscoConfig, {
        onMessage(event) {
          process.stdout.write(JSON.parse(event.data).text)
        },
      })
    }
  }
}
