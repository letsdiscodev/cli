import {Command, Flags} from '@oclif/core'

import {getDisco, DiscoConfig} from '../../config.js'
import {request, readEventSource} from '../../auth-request.js'
import {ProjectCreateResponse} from '../postgres/addon/install.js'
import {GithubReposResponse} from '../github/repos/list.js'

interface ProjectExport {
  name: string
  githubRepo: null | string
  branch: null | string
  domains: string[]
  envVariables: {name: string; value: string}[]
  caddy: {name: string; crt: string; key: string; meta: string}[]
  deployment: {commit: string; number: number} | null
  scale: Record<string, number>
  volumes: string[]
}

interface DeploymentsResponse {
  deployments: {number: number; status: string}[]
}

export default class ProjectsMove extends Command {
  static override description = `move a project from one server to another
the project is created on the destination server with the same GitHub repo, branch, domains, env variables and scale, deployed at the same commit, and the TLS certificates are copied so that the domains are served over HTTPS as soon as they point to the destination server.
the source server keeps serving the project until you point the DNS to the destination server, then remove the project from the source server.
the destination server must have GitHub access to the repo (see "disco github:apps:add"). volumes are not moved.`

  static override examples = [
    '<%= config.bin %> <%= command.id %> --project mysite --from-disco disco.example.com --to-disco disco2.example.com',
  ]

  static override flags = {
    project: Flags.string({required: true, description: 'project name'}),
    'from-disco': Flags.string({required: true, description: 'source server'}),
    'to-disco': Flags.string({required: true, description: 'destination server'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ProjectsMove)
    const fromDisco = getDisco(flags['from-disco'])
    const toDisco = getDisco(flags['to-disco'])

    const exportUrl = `https://${fromDisco.host}/api/projects/${flags.project}/export`
    const exportResponse = await request({method: 'GET', url: exportUrl, discoConfig: fromDisco})
    const project = (await exportResponse.json()) as ProjectExport

    if (project.githubRepo === null) {
      this.error(`${flags.project} has no GitHub repo, only projects deployed from GitHub can be moved`)
    }

    if (project.deployment === null) {
      this.error(`${flags.project} has never been deployed, deploy it first`)
    }

    if (!(await hasGithubAccess(toDisco, project.githubRepo))) {
      this.error(`${flags['to-disco']} does not have access to ${project.githubRepo}.
Give it access first by running "disco github:apps:add --disco ${flags['to-disco']}"
or "disco github:apps:manage <your github username> --disco ${flags['to-disco']}".`)
    }

    this.log(`Creating ${project.name} on ${flags['to-disco']}`)
    const createResponse = await request({
      method: 'POST',
      url: `https://${toDisco.host}/api/projects`,
      discoConfig: toDisco,
      body: {
        name: project.name,
        githubRepo: project.githubRepo,
        branch: project.branch,
        domains: project.domains,
        envVariables: project.envVariables,
        caddy: project.caddy,
        commit: project.deployment.commit,
      },
      expectedStatuses: [201],
    })
    const created = (await createResponse.json()) as ProjectCreateResponse
    if (created.deployment === null) {
      this.error('The project was created but no deployment was started')
    }

    const deploymentNumber = created.deployment.number
    this.log(`Deploying ${project.name}, version ${deploymentNumber}`)
    const outputUrl = `https://${toDisco.host}/api/projects/${project.name}/deployments/${deploymentNumber}/output`
    const {done} = readEventSource(outputUrl, toDisco, {
      onMessage(event) {
        process.stdout.write(JSON.parse(event.data).text)
      },
    })
    await done

    const status = await deploymentStatus(toDisco, project.name, deploymentNumber)
    if (status !== 'COMPLETE') {
      this.error(`Deployment ${deploymentNumber} on ${flags['to-disco']} ended with status ${status}`)
    }

    const scale = Object.fromEntries(Object.entries(project.scale).filter(([, replicas]) => replicas !== 1))
    if (Object.keys(scale).length > 0) {
      this.log(`Scaling ${Object.entries(scale).map(([service, replicas]) => `${service}=${replicas}`).join(' ')}`)
      await request({
        method: 'POST',
        url: `https://${toDisco.host}/api/projects/${project.name}/scale`,
        discoConfig: toDisco,
        body: {services: scale},
      })
    }

    this.log('')
    this.log(`${project.name} is now running on ${flags['to-disco']} and still running on ${flags['from-disco']}.`)
    this.log('Next steps:')
    for (const domain of project.domains) {
      this.log(`  - point the DNS of ${domain} to ${flags['to-disco']}`)
    }

    if (project.volumes.length > 0) {
      this.log(`  - volumes are not moved, copy them yourself if needed: ${project.volumes.join(', ')}`)
    }

    this.log(`  - once the DNS has switched, remove the project from the source server:`)
    this.log(`      disco projects:remove --project ${project.name} --disco ${flags['from-disco']}`)
  }
}

async function hasGithubAccess(discoConfig: DiscoConfig, githubRepo: string): Promise<boolean> {
  const url = `https://${discoConfig.host}/api/github-app-repos`
  const res = await request({method: 'GET', url, discoConfig})
  const data = (await res.json()) as GithubReposResponse
  return data.repos.some((repo) => repo.fullName === githubRepo)
}

async function deploymentStatus(discoConfig: DiscoConfig, project: string, number: number): Promise<string> {
  const url = `https://${discoConfig.host}/api/projects/${project}/deployments`
  const res = await request({method: 'GET', url, discoConfig})
  const data = (await res.json()) as DeploymentsResponse
  const deployment = data.deployments.find((d) => d.number === number)
  return deployment === undefined ? 'UNKNOWN' : deployment.status
}
