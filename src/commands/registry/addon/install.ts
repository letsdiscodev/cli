import {Command, Flags} from '@oclif/core'
import {DiscoConfig, getDisco} from '../../../config.js'
import {request, readEventSource} from '../../../auth-request.js'

const addonProjectName = 'addon-registry';
const addonRepo = 'letsdiscodev/disco-addon-docker-registry';
const branch = 'main';

export default class RegistryAddonInstall extends Command {
  static description = 'install Registry addon'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    domain: Flags.string({
      required: true,
      description: 'domain name where the registry will be served, e.g. registry.example.com',
    }),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(RegistryAddonInstall)
    const discoConfig = getDisco(flags.disco || null)
    this.log(`Adding ${addonProjectName} project`)
    await addProject({discoConfig, domain: flags.domain})
    this.log(`Setting env variables for ${addonProjectName}`)
    await setProjectEnvVariables({discoConfig, domain: flags.domain})
    this.log('Adding user to registry')
    const {username, password} = await addUser({discoConfig})
    this.log('Setting up Disco to use Registry')
    await setupRegistry({discoConfig, username, password, domain: flags.domain})
    this.log('Done')
  }
}

async function addProject({discoConfig, domain}: {discoConfig: DiscoConfig, domain: string}) {
  const url = `https://${discoConfig.host}/api/projects`
  const body = {
    name: addonProjectName,
    githubRepo: addonRepo,
    branch,
    domain
  }

  const res = await request({method: 'POST', url, discoConfig, body, expectedStatuses: [201]})
  const {deployment} = (await res.json()) as {deployment: {number: number}}
  if (deployment) {
    const url = `https://${discoConfig.host}/api/projects/${addonProjectName}/deployments/${deployment.number}/output`

    await readEventSource(url, discoConfig, {
      onMessage(event: MessageEvent) {
        process.stdout.write(JSON.parse(event.data).text)
      },
    })
  }
}

async function setProjectEnvVariables({discoConfig, domain}: {discoConfig: DiscoConfig, domain: string}) {
  const url = `https://${discoConfig.host}/api/projects/${addonProjectName}/env`
  const body = {
    envVariables: [
      {
        "name": "REGISTRY_HTTP_HOST",
        "value": `https://${domain}`,
    },
    {
        "name": "REGISTRY_AUTH",
        "value": "htpasswd",
    },
    {
        "name": "REGISTRY_AUTH_HTPASSWD_REALM",
        "value": "Registry Realm",
    },
    {
        "name": "REGISTRY_AUTH_HTPASSWD_PATH",
        "value": "/auth/htpasswd",
    },
  ],
  }

  const res = await request({method: 'POST', url, discoConfig, body})
  const data = (await res.json()) as {deployment: {number: number}}
  const deploymentUrl = `https://${discoConfig.host}/api/projects/${addonProjectName}/deployments/${data.deployment.number}/output`
  await readEventSource(deploymentUrl, discoConfig, {
    onMessage(event: MessageEvent) {
      const output = JSON.parse(event.data)
      process.stdout.write(output.text)
    },
  })
}

async function addUser({discoConfig}: {discoConfig: DiscoConfig}): Promise<{username: string; password: string}> {
  const url = `https://${discoConfig.host}/api/projects/${addonProjectName}/cgi/endpoints/users`
  const res = await request({
    method: 'POST',
    url,
    discoConfig,
    expectedStatuses: [200],
  })
  const {user: {username, password}} = (await res.json()) as {user:{
    username: string
    password: string
  }}
  return {username, password}
}

async function setupRegistry({
  discoConfig,
  username,
  password,
  domain,
}: {
  discoConfig: DiscoConfig
  username: string
  password: string
  domain: string
}) {
  const reqBody = {
    host: domain,
    authType: 'basic',
    username,
    password,
  }
  const url = `https://${discoConfig.host}/api/disco/registry`
  await request({
    method: 'POST',
    body: reqBody,
    url,
    discoConfig,
    expectedStatuses: [200],
  })
}
