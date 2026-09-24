// meta:host in-process: dns, the prompt and the network replaced
import {expect, test} from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import {Addresses} from '../../src/default-domain.js'
import {dns, net, ui} from '../../src/commands/meta/host.js'

const original = {resolve: dns.resolve, request: net.request, confirm: ui.confirm}
let configFile: string
let posted: {url: string; body: unknown}[]
let answered: boolean

// a config with one disco at old.test, a fake dns table, a prompt answering `answer`
function setUp({answers, answer}: {answers: Record<string, Addresses>; answer: boolean}) {
  return () => {
    configFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'disco-home-')), 'config.json')
    fs.writeFileSync(configFile, JSON.stringify({discos: {srv: {name: 'srv', host: 'old.test', apiKey: 'k'}}}))
    process.env.DISCO_CONFIG_PATH = configFile
    posted = []
    answered = false
    dns.resolve = async (name: string) => {
      if (!(name in answers)) throw Object.assign(new Error('nope'), {code: 'ENOTFOUND'})
      return answers[name]
    }

    net.request = (async (args: {url: string; body: unknown}) => {
      posted.push({url: args.url, body: args.body})
      return {json: async () => ({version: '0.33.0', discoHost: 'new.test', registryHost: null})}
    }) as typeof net.request
    ui.confirm = (async () => {
      answered = true
      return answer
    }) as typeof ui.confirm
  }
}

const restore = () => {
  Object.assign(dns, {resolve: original.resolve})
  Object.assign(net, {request: original.request})
  Object.assign(ui, {confirm: original.confirm})
  delete process.env.DISCO_CONFIG_PATH
}

const hostInConfig = () => JSON.parse(fs.readFileSync(configFile, 'utf8')).discos.srv.host

const same = {'old.test': {a: ['1.1.1.1'], aaaa: []}, 'new.test': {a: ['1.1.1.1'], aaaa: []}}
const elsewhere = {'old.test': {a: ['1.1.1.1'], aaaa: []}, 'new.test': {a: ['9.9.9.9'], aaaa: []}}

describe('meta:host', () => {
  test
    .do(setUp({answers: elsewhere, answer: true}))
    .finally(restore)
    .command(['meta:host', 'new.test', '--disco', 'srv', '--no-input'])
    .catch((error) => {
      expect((error as {oclif?: {exit?: number}}).oclif?.exit).to.equal(2)
      expect(error.message).to.contain('new.test resolves to 9.9.9.9 but the server (old.test) is at 1.1.1.1')
    })
    .it('exits 2 and changes nothing when the new host points elsewhere', () => {
      expect(posted).to.deep.equal([])
      expect(hostInConfig()).to.equal('old.test')
    })

  test
    .do(setUp({answers: elsewhere, answer: true}))
    .finally(restore)
    .stdout()
    .command(['meta:host', 'new.test', '--disco', 'srv', '--no-input', '--force'])
    .it('--force skips the dns check', (ctx) => {
      expect(posted).to.deep.equal([{url: 'https://old.test/api/disco/host', body: {host: 'new.test'}}])
      expect(hostInConfig()).to.equal('new.test')
      expect(ctx.stdout).to.contain('Host set to new.test')
    })

  test
    .do(setUp({answers: same, answer: true}))
    .finally(restore)
    .stdout()
    .command(['meta:host', 'new.test', '--disco', 'srv', '--no-input'])
    .it('sets the host without a prompt when dns matches and --no-input is given', (ctx) => {
      expect(answered).to.equal(false)
      expect(posted).to.have.length(1)
      expect(hostInConfig()).to.equal('new.test')
      expect(ctx.stdout).to.contain('Host set to new.test')
    })

  test
    .do(setUp({answers: same, answer: false}))
    .finally(restore)
    .stdout()
    .command(['meta:host', 'new.test', '--disco', 'srv'])
    .it('asks, and does nothing on no', (ctx) => {
      expect(answered).to.equal(true)
      expect(posted).to.deep.equal([])
      expect(hostInConfig()).to.equal('old.test')
      expect(ctx.stdout).to.contain('Not doing anything.')
    })

  test
    .do(setUp({answers: same, answer: true}))
    .finally(restore)
    .stdout()
    .command(['meta:host', 'new.test', '--disco', 'srv'])
    .it('asks, and sets the host on yes', () => {
      expect(answered).to.equal(true)
      expect(posted).to.have.length(1)
      expect(hostInConfig()).to.equal('new.test')
    })

  test
    .do(setUp({answers: same, answer: true}))
    .finally(restore)
    .stdout()
    .command(['meta:host', 'old.test', '--disco', 'srv'])
    .it('does nothing when the host is already the current one', (ctx) => {
      expect(answered).to.equal(false)
      expect(posted).to.deep.equal([])
      expect(ctx.stdout).to.contain('already the host')
    })

  test
    .do(() => {
      setUp({answers: same, answer: true})()
      net.request = (async () => {
        throw new Error('HTTP error: 422 Domain already taken by other project')
      }) as typeof net.request
    })
    .finally(restore)
    .command(['meta:host', 'new.test', '--disco', 'srv', '--no-input'])
    .catch((error) => {
      expect((error as {oclif?: {exit?: number}}).oclif?.exit).to.equal(2)
      expect(error.message).to.contain('Could not set the host: HTTP error: 422 Domain already taken')
    })
    .it('fails with the daemon reason and leaves the config alone when the server refuses', () => {
      expect(hostInConfig()).to.equal('old.test')
    })
})
