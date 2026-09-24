// the reminder logic with the network replaced and a temp ~/.disco
import {expect} from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import {
  CLI_CHECK_EVERY,
  DAEMON_CHECK_EVERY,
  DAEMON_TAGS_URL,
  checkForUpdates,
  net,
  newestTag,
  stateFile,
} from '../src/update-reminders.js'

const MANIFEST = 'https://cli-assets.test/channels/stable/disco-darwin-arm64-buildmanifest'
const NOW = Date.parse('2026-09-24T12:00:00Z')

// a fresh config folder per test, with the given discos
function useConfig(discos: string[]): string {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'disco-home-'))
  const entries = Object.fromEntries(discos.map((name) => [name, {name, host: `${name}.test`, apiKey: `key-${name}`}]))
  fs.writeFileSync(path.join(folder, 'config.json'), JSON.stringify({discos: entries}))
  process.env.DISCO_CONFIG_PATH = path.join(folder, 'config.json')
  return folder
}

function writeState(state: unknown): void {
  fs.writeFileSync(stateFile(), JSON.stringify(state))
}

function readState(): {cli?: {checkedAt: number}; daemons?: {[host: string]: {checkedAt: number}}} {
  return JSON.parse(fs.readFileSync(stateFile(), 'utf8'))
}

const tags = (...names: string[]) => ({results: names.map((name) => ({name}))})

// what the fake network answers per url; a function throws to simulate failures
let answers: {[url: string]: (() => unknown) | unknown}
let fetched: {url: string; headers: Record<string, string>}[]
let lines: string[]
const originalFetchJson = net.fetchJson

function run(overrides: Partial<Parameters<typeof checkForUpdates>[0]> = {}) {
  return checkForUpdates({
    argv: [],
    commandHasDiscoFlag: true,
    env: {},
    now: NOW,
    cli: {bin: 'disco', version: '0.5.67', manifestUrl: MANIFEST},
    log: (line) => lines.push(line),
    ...overrides,
  })
}

describe('update reminders', () => {
  beforeEach(() => {
    answers = {}
    fetched = []
    lines = []
    net.fetchJson = async (url, headers = {}) => {
      fetched.push({url, headers})
      if (!(url in answers)) throw new Error(`unexpected fetch ${url}`)
      const answer = answers[url]
      return typeof answer === 'function' ? answer() : answer
    }
  })

  afterEach(() => {
    net.fetchJson = originalFetchJson
    delete process.env.DISCO_CONFIG_PATH
  })

  describe('the cli itself', () => {
    it('prints one line and records the check when the manifest is newer', async () => {
      useConfig([])
      answers[MANIFEST] = {version: '0.5.68'}
      await run({commandHasDiscoFlag: false})
      expect(lines).to.deep.equal(['disco 0.5.68 is out (you have 0.5.67), run disco update'])
      expect(readState().cli).to.deep.equal({checkedAt: NOW})
    })

    it('prints nothing when the manifest is the same or older', async () => {
      useConfig([])
      answers[MANIFEST] = {version: '0.5.67'}
      await run({commandHasDiscoFlag: false})
      answers[MANIFEST] = {version: '0.5.66'}
      writeState({})
      await run({commandHasDiscoFlag: false})
      expect(lines).to.deep.equal([])
      expect(fetched.map((f) => f.url)).to.deep.equal([MANIFEST, MANIFEST])
    })

    it('does not fetch again within a day, does after', async () => {
      useConfig([])
      answers[MANIFEST] = {version: '0.5.68'}
      writeState({cli: {checkedAt: NOW - 2 * 60 * 60 * 1000}})
      await run({commandHasDiscoFlag: false})
      expect(fetched).to.deep.equal([])
      expect(lines).to.deep.equal([])
      await run({commandHasDiscoFlag: false, now: NOW + CLI_CHECK_EVERY})
      expect(fetched.map((f) => f.url)).to.deep.equal([MANIFEST])
      expect(lines).to.have.length(1)
    })

    it('is silent when the network fails or the manifest is garbage, and still records the check', async () => {
      useConfig([])
      answers[MANIFEST] = () => {
        throw new Error('offline')
      }

      await run({commandHasDiscoFlag: false})
      expect(readState().cli).to.deep.equal({checkedAt: NOW})
      for (const garbage of [{}, 'nope', null, {version: 42}, {version: 'latest'}]) {
        answers[MANIFEST] = garbage
        writeState({})
        // eslint-disable-next-line no-await-in-loop
        await run({commandHasDiscoFlag: false})
      }

      expect(lines).to.deep.equal([])
    })

    it('does not check a development build (version 0.0.0) or without a manifest url', async () => {
      useConfig([])
      answers[MANIFEST] = {version: '0.5.68'}
      await run({commandHasDiscoFlag: false, cli: {bin: 'disco', version: '0.0.0', manifestUrl: MANIFEST}})
      await run({commandHasDiscoFlag: false, cli: {bin: 'disco', version: '0.5.67', manifestUrl: null}})
      expect(fetched).to.deep.equal([])
      expect(fs.existsSync(stateFile())).to.equal(false)
    })
  })

  describe('DISCO_NO_UPDATE_CHECK', () => {
    it('set: no fetch, no line, no state file', async () => {
      useConfig(['alpha'])
      answers[MANIFEST] = {version: '0.5.68'}
      answers['https://alpha.test/api/disco/meta'] = {version: '0.32.0'}
      answers[DAEMON_TAGS_URL] = tags('latest', '0.33.0')
      await run({env: {DISCO_NO_UPDATE_CHECK: '1'}})
      expect(fetched).to.deep.equal([])
      expect(lines).to.deep.equal([])
      expect(fs.existsSync(stateFile())).to.equal(false)
    })

    it('unset or empty: the checks run', async () => {
      useConfig(['alpha'])
      answers[MANIFEST] = {version: '0.5.68'}
      answers['https://alpha.test/api/disco/meta'] = {version: '0.32.0'}
      answers[DAEMON_TAGS_URL] = tags('latest', '0.33.0')
      await run({env: {}})
      expect(lines).to.have.length(2)
      lines = []
      writeState({})
      await run({env: {DISCO_NO_UPDATE_CHECK: ''}})
      expect(lines).to.have.length(2)
    })
  })

  describe('the daemon of the server the command talked to', () => {
    it('one disco in the config: the upgrade command has no --disco', async () => {
      useConfig(['alpha'])
      answers[MANIFEST] = {version: '0.5.67'}
      answers['https://alpha.test/api/disco/meta'] = {version: '0.32.0'}
      answers[DAEMON_TAGS_URL] = tags('latest', '0.33.0', '0.31.3')
      await run()
      expect(lines).to.deep.equal(['alpha runs daemon 0.32.0, 0.33.0 is out, run disco meta:upgrade'])
      const meta = fetched.find((f) => f.url === 'https://alpha.test/api/disco/meta')
      expect(meta?.headers.Authorization).to.equal('Basic ' + Buffer.from('key-alpha:').toString('base64'))
      expect(readState().daemons).to.deep.equal({'alpha.test': {checkedAt: NOW}})
    })

    it('several discos in the config: the upgrade command names the one from --disco', async () => {
      useConfig(['alpha', 'beta'])
      answers[MANIFEST] = {version: '0.5.67'}
      answers['https://beta.test/api/disco/meta'] = {version: '0.31.3'}
      answers[DAEMON_TAGS_URL] = tags('0.33.0', 'latest')
      await run({argv: ['--project', 'x', '--disco', 'beta']})
      expect(lines).to.deep.equal(['beta runs daemon 0.31.3, 0.33.0 is out, run disco meta:upgrade --disco beta'])
      lines = []
      writeState({})
      await run({argv: ['--disco=beta']})
      expect(lines).to.deep.equal(['beta runs daemon 0.31.3, 0.33.0 is out, run disco meta:upgrade --disco beta'])
      expect(fetched.some((f) => f.url.includes('alpha.test'))).to.equal(false)
    })

    it('several discos and no --disco: nothing to check', async () => {
      useConfig(['alpha', 'beta'])
      answers[MANIFEST] = {version: '0.5.67'}
      await run()
      expect(fetched.map((f) => f.url)).to.deep.equal([MANIFEST])
      expect(lines).to.deep.equal([])
    })

    it('a command without a --disco flag never checks a daemon, even with one disco', async () => {
      useConfig(['alpha'])
      answers[MANIFEST] = {version: '0.5.67'}
      await run({commandHasDiscoFlag: false})
      expect(fetched.map((f) => f.url)).to.deep.equal([MANIFEST])
    })

    it('an unknown --disco name is ignored', async () => {
      useConfig(['alpha'])
      answers[MANIFEST] = {version: '0.5.67'}
      await run({argv: ['--disco', 'nope']})
      expect(fetched.map((f) => f.url)).to.deep.equal([MANIFEST])
    })

    it('prints nothing when the daemon is up to date', async () => {
      useConfig(['alpha'])
      answers[MANIFEST] = {version: '0.5.67'}
      answers['https://alpha.test/api/disco/meta'] = {version: '0.33.0'}
      answers[DAEMON_TAGS_URL] = tags('latest', '0.33.0')
      await run()
      expect(lines).to.deep.equal([])
    })

    it('is silent when the server or docker hub fail, and records the check so it waits a week', async () => {
      useConfig(['alpha'])
      answers[MANIFEST] = {version: '0.5.67'}
      answers['https://alpha.test/api/disco/meta'] = () => {
        throw new Error('401')
      }

      answers[DAEMON_TAGS_URL] = tags('latest', '0.33.0')
      await run()
      expect(lines).to.deep.equal([])
      expect(readState().daemons).to.deep.equal({'alpha.test': {checkedAt: NOW}})
      answers['https://alpha.test/api/disco/meta'] = {version: '0.32.0'}
      answers[DAEMON_TAGS_URL] = () => {
        throw new Error('hub down')
      }

      writeState({})
      await run()
      expect(lines).to.deep.equal([])
    })

    it('checks a server once a week, each server on its own clock', async () => {
      useConfig(['alpha', 'beta'])
      answers[MANIFEST] = {version: '0.5.67'}
      answers['https://alpha.test/api/disco/meta'] = {version: '0.32.0'}
      answers['https://beta.test/api/disco/meta'] = {version: '0.32.0'}
      answers[DAEMON_TAGS_URL] = tags('0.33.0')
      writeState({cli: {checkedAt: NOW}, daemons: {'alpha.test': {checkedAt: NOW - 3 * 24 * 60 * 60 * 1000}}})
      await run({argv: ['--disco', 'alpha']})
      expect(fetched).to.deep.equal([])
      await run({argv: ['--disco', 'beta']})
      expect(lines).to.deep.equal(['beta runs daemon 0.32.0, 0.33.0 is out, run disco meta:upgrade --disco beta'])
      lines = []
      await run({argv: ['--disco', 'alpha'], now: NOW + DAEMON_CHECK_EVERY - 3 * 24 * 60 * 60 * 1000})
      expect(lines).to.deep.equal(['alpha runs daemon 0.32.0, 0.33.0 is out, run disco meta:upgrade --disco alpha'])
    })
  })

  describe('newestTag', () => {
    it('picks the highest version and ignores latest and junk', () => {
      expect(newestTag(tags('latest', '0.9.0', '0.33.0', 'main-abc', '0.31.3'))).to.equal('0.33.0')
      expect(newestTag(tags('latest'))).to.equal(null)
      expect(newestTag({})).to.equal(null)
      expect(newestTag('nope')).to.equal(null)
    })
  })
})
