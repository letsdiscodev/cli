import {expect, test} from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import {net} from '../../src/commands/deploy/cancel.js'

const configFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'disco-home-')), 'config.json')
fs.writeFileSync(configFile, JSON.stringify({discos: {fake: {name: 'fake', host: 'fake.test', apiKey: 'k'}}}))

const calls: string[] = []
const original = {...net}
const fakeNet = (status: number, response: unknown) => () => {
  calls.length = 0
  net.request = (async (args: {method: string; url: string}) => {
    calls.push(`${args.method} ${args.url}`)
    return {status, json: async () => response}
  }) as unknown as typeof net.request
}

const restoreNet = () => Object.assign(net, original)

const run = (status: number, response: unknown) =>
  test.env({DISCO_CONFIG_PATH: configFile}).do(fakeNet(status, response)).finally(restoreNet).stdout()

describe('deploy:cancel', () => {
  run(200, {cancelledDeployments: [{number: 12}, {number: 13}]})
    .command(['deploy:cancel', '--project', 'app', '--disco', 'fake', '--json'])
    .it('without a number asks the daemon for 0 and prints every cancelled deployment as json', (ctx) => {
      expect(calls).to.deep.equal(['DELETE https://fake.test/api/projects/app/deployments/0'])
      expect(JSON.parse(ctx.stdout)).to.deep.equal({cancelledDeployments: [{number: 12}, {number: 13}]})
    })

  run(200, {cancelledDeployments: []})
    .command(['deploy:cancel', '--project', 'app', '--disco', 'fake', '--json'])
    .it('prints an empty list as json when nothing was cancelled', (ctx) => {
      expect(JSON.parse(ctx.stdout)).to.deep.equal({cancelledDeployments: []})
    })

  run(200, {cancelledDeployments: []})
    .command(['deploy:cancel', '--project', 'app', '--disco', 'fake'])
    .it('says so when nothing was cancelled', (ctx) => {
      expect(ctx.stdout).to.equal('Nothing to cancel\n')
    })

  run(200, {cancelledDeployments: [{number: 4}]})
    .command(['deploy:cancel', '--project', 'app', '--deployment', '4', '--disco', 'fake'])
    .it('cancels one deployment by number', (ctx) => {
      expect(calls).to.deep.equal(['DELETE https://fake.test/api/projects/app/deployments/4'])
      expect(ctx.stdout).to.equal('Deployment 4 cancelled\n')
    })

  run(422, {detail: 'Cannot cancel deployment 4, status COMPLETE not one of QUEUED, PREPARING, REPLACING'})
    .command(['deploy:cancel', '--project', 'app', '--deployment', '4', '--disco', 'fake'])
    .catch((error) => {
      expect((error as {oclif?: {exit?: number}}).oclif?.exit).to.equal(2)
      expect(error.message).to.contain('status COMPLETE')
    })
    .it('fails with the daemon reason when the deployment cannot be cancelled')
})
