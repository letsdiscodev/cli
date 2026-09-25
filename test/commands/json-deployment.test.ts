// --json on the commands that start a deployment: stdout is only the JSON, the
// deployment output is not streamed, and --json never becomes an env var
import {expect, test} from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import {net as deployNet} from '../../src/commands/deploy.js'
import {net as envRemoveNet} from '../../src/commands/env/remove.js'
import {net as envSetNet} from '../../src/commands/env/set.js'
import {net as projectsAddNet} from '../../src/commands/projects/add.js'

const configFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'disco-home-')), 'config.json')
fs.writeFileSync(configFile, JSON.stringify({discos: {fake: {name: 'fake', host: 'fake.test', apiKey: 'k'}}}))

type Net = typeof deployNet
const nets: Net[] = [deployNet, envRemoveNet, envSetNet, projectsAddNet]
const originals = nets.map((n) => ({...n}))

const requests: {method: string; url: string; body: unknown}[] = []
const streamed: string[] = []

// every request answers with `response`
const fakeNet = (response: unknown) => () => {
  requests.length = 0
  streamed.length = 0
  for (const n of nets) {
    n.request = (async (args: {method: string; url: string; body?: unknown; bodyStream?: AsyncIterable<Buffer>}) => {
      // read the upload like a server would, before deploy --dir removes its temp file
      const chunks: Buffer[] = []
      if (args.bodyStream) for await (const chunk of args.bodyStream) chunks.push(chunk)
      requests.push({method: args.method, url: args.url, body: args.body})
      return {status: 201, json: async () => response}
    }) as unknown as Net['request']
    n.readEventSource = ((url: string) => {
      streamed.push(url)
      return {eventSource: {close() {}}, done: Promise.resolve()}
    }) as unknown as Net['readEventSource']
  }
}

const restoreNet = () => {
  for (const [i, n] of nets.entries()) Object.assign(n, originals[i])
}

const run = (response: unknown) => test.env({DISCO_CONFIG_PATH: configFile}).do(fakeNet(response)).finally(restoreNet).stdout()

describe('deploy --json', () => {
  run({deployment: {number: 7}})
    .command(['deploy', '--project', 'app', '--commit', 'abc', '--disco', 'fake', '--json'])
    .it('prints only the deployment number and does not stream', (ctx) => {
      expect(JSON.parse(ctx.stdout)).to.deep.equal({deployment: {number: 7}})
      expect(requests).to.deep.equal([
        {method: 'POST', url: 'https://fake.test/api/projects/app/deployments', body: {commit: 'abc'}},
      ])
      expect(streamed).to.deep.equal([])
    })

  run({deployment: {number: 7}})
    .command(['deploy', '--project', 'app', '--disco', 'fake'])
    .it('still streams without --json', (ctx) => {
      expect(streamed).to.deep.equal(['https://fake.test/api/projects/app/deployments/7/output'])
      expect(ctx.stdout).to.equal('')
    })

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'disco-app-'))
  fs.writeFileSync(path.join(dir, 'disco.json'), '{"version":"1.0","services":{"web":{"port":8000}}}')

  run({deployment: {number: 8}})
    .command(['deploy', '--project', 'app', '--dir', dir, '--disco', 'fake', '--json'])
    .it('--dir prints only the deployment number, no progress lines', (ctx) => {
      expect(JSON.parse(ctx.stdout)).to.deep.equal({deployment: {number: 8}})
      expect(requests.map((r) => r.url)).to.deep.equal(['https://fake.test/api/projects/app/files'])
      expect(streamed).to.deep.equal([])
    })
})

describe('env:set --json', () => {
  run({deployment: {number: 3}})
    .command(['env:set', '--project', 'app', '--disco', 'fake', 'A=1', '--json', 'B=2'])
    .it('prints only the deployment number, and --json is not an env var', (ctx) => {
      expect(JSON.parse(ctx.stdout)).to.deep.equal({deployment: {number: 3}})
      expect(requests).to.deep.equal([
        {
          method: 'POST',
          url: 'https://fake.test/api/projects/app/env',
          body: {
            envVariables: [
              {name: 'A', value: '1'},
              {name: 'B', value: '2'},
            ],
          },
        },
      ])
      expect(streamed).to.deep.equal([])
    })

  run({deployment: null})
    .command(['env:set', '--project', 'app', '--disco', 'fake', 'A=1', '--json'])
    .it('prints a null deployment when the daemon did not deploy', (ctx) => {
      expect(JSON.parse(ctx.stdout)).to.deep.equal({deployment: null})
    })

  run({deployment: {number: 3}})
    .command(['env:set', '--project', 'app', '--disco', 'fake', 'A=1'])
    .it('still streams without --json', () => {
      expect(streamed).to.deep.equal(['https://fake.test/api/projects/app/deployments/3/output'])
    })
})

describe('env:remove --json', () => {
  run({deployment: {number: 4}})
    .command(['env:remove', '--project', 'app', '--disco', 'fake', '--json', 'A', 'B'])
    .it('prints only the deployment number, and --json is not a name to remove', (ctx) => {
      expect(JSON.parse(ctx.stdout)).to.deep.equal({deployment: {number: 4}})
      expect(requests).to.deep.equal([
        {
          method: 'POST',
          url: 'https://fake.test/api/projects/app/env',
          body: {
            envVariables: [
              {name: 'A', value: null},
              {name: 'B', value: null},
            ],
          },
        },
      ])
      expect(streamed).to.deep.equal([])
    })

  run({deployment: null})
    .command(['env:remove', '--project', 'app', '--disco', 'fake', 'A', '--json'])
    .it('prints a null deployment when the daemon did not deploy', (ctx) => {
      expect(JSON.parse(ctx.stdout)).to.deep.equal({deployment: null})
    })

  run({deployment: {number: 4}})
    .command(['env:remove', '--project', 'app', '--disco', 'fake', 'A'])
    .it('still streams without --json', () => {
      expect(streamed).to.deep.equal(['https://fake.test/api/projects/app/deployments/4/output'])
    })
})

describe('projects:add --json', () => {
  run({project: {name: 'blog'}, deployment: {number: 1}})
    .command([
      'projects:add',
      '--name',
      'blog',
      '--domain',
      'blog.example.test',
      '--github',
      'me/blog',
      '--deployPublicRepo',
      '--disco',
      'fake',
      'A=1',
      '--json',
    ])
    .it('prints project, domain and deployment, and does not stream', (ctx) => {
      expect(JSON.parse(ctx.stdout)).to.deep.equal({
        project: {name: 'blog'},
        domain: 'blog.example.test',
        deployment: {number: 1},
      })
      expect(requests.map((r) => `${r.method} ${r.url}`)).to.deep.equal(['POST https://fake.test/api/projects'])
      expect((requests[0].body as {envVariables: unknown}).envVariables).to.deep.equal([{name: 'A', value: '1'}])
      expect(streamed).to.deep.equal([])
    })

  run({project: {name: 'worker'}, deployment: null})
    .command(['projects:add', '--name', 'worker', '--no-domain', '--disco', 'fake', '--json'])
    .it('prints a null domain and a null deployment for --no-domain without a repo', (ctx) => {
      expect(JSON.parse(ctx.stdout)).to.deep.equal({project: {name: 'worker'}, domain: null, deployment: null})
      expect((requests[0].body as {envVariables: unknown}).envVariables).to.deep.equal([])
    })

  run({project: {name: 'blog'}, deployment: {number: 1}})
    .command(['projects:add', '--name', 'blog', '--no-domain', '--github', 'me/blog', '--deployPublicRepo', '--disco', 'fake'])
    .it('still streams without --json', (ctx) => {
      expect(streamed).to.deep.equal(['https://fake.test/api/projects/blog/deployments/1/output'])
      expect(ctx.stdout).to.contain('Deploying blog, version 1')
    })
})
