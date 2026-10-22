import {expect} from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import {addDisco, getConfig, permissions, setHost} from '../src/config.js'

function useConfig(discos: {name: string; host: string}[]): string {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'disco-home-')), 'config.json')
  const entries = Object.fromEntries(discos.map((d) => [d.name, {...d, apiKey: 'k'}]))
  fs.writeFileSync(file, JSON.stringify({discos: entries}))
  process.env.DISCO_CONFIG_PATH = file
  return file
}

const mode = (target: string) => fs.statSync(target).mode % 0o1000

describe('config file permissions', () => {
  const original = {...permissions}
  let lines: string[]

  beforeEach(() => {
    lines = []
    permissions.warn = (line) => lines.push(line)
    permissions.platform = 'linux'
  })

  afterEach(() => {
    Object.assign(permissions, original)
    delete process.env.DISCO_CONFIG_PATH
  })

  it('creates a new config readable by the user only, folder included', () => {
    const folder = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'disco-home-')), 'sub')
    process.env.DISCO_CONFIG_PATH = path.join(folder, 'config.json')
    addDisco({name: 'srv', host: 'srv.test', apiKey: 'k'})
    expect(mode(folder)).to.equal(0o700)
    expect(mode(path.join(folder, 'config.json'))).to.equal(0o600)
    expect(lines).to.deep.equal([])
  })

  it('fixes a config others can read when it is read, and says so once', () => {
    const file = useConfig([{name: 'srv', host: 'srv.test'}])
    fs.chmodSync(path.dirname(file), 0o755)
    fs.chmodSync(file, 0o644)
    expect(getConfig().discos.srv.apiKey).to.equal('k')
    expect(mode(path.dirname(file))).to.equal(0o700)
    expect(mode(file)).to.equal(0o600)
    expect(lines).to.have.length(2)
    expect(lines[1]).to.contain('set to 600 (were 644)')
    getConfig()
    expect(lines).to.have.length(2)
  })

  it('fixes a config others can read when it is written', () => {
    const file = useConfig([{name: 'srv', host: 'srv.test'}])
    fs.chmodSync(file, 0o644)
    setHost('srv', 'new.test')
    expect(mode(file)).to.equal(0o600)
    expect(fs.readFileSync(file, 'utf8')).to.contain('new.test')
  })

  it('leaves a config that is already private alone, read-only included', () => {
    const file = useConfig([{name: 'srv', host: 'srv.test'}])
    fs.chmodSync(file, 0o600)
    getConfig()
    expect(mode(file)).to.equal(0o600)
    fs.chmodSync(file, 0o400)
    getConfig()
    expect(mode(file)).to.equal(0o400)
    expect(lines).to.deep.equal([])
  })

  it('still reads the config when the permissions cannot be changed, with one warning', () => {
    const file = useConfig([{name: 'srv', host: 'srv.test'}])
    fs.chmodSync(file, 0o644)
    permissions.chmod = () => {
      throw new Error('EPERM: operation not permitted')
    }

    expect(getConfig().discos.srv.host).to.equal('srv.test')
    getConfig()
    expect(mode(file)).to.equal(0o644)
    expect(lines).to.have.length(1)
    expect(lines[0]).to.contain('Could not restrict')
    expect(lines[0]).to.contain('EPERM')
  })

  it('does nothing on windows', () => {
    const file = useConfig([{name: 'srv', host: 'srv.test'}])
    fs.chmodSync(file, 0o644)
    permissions.platform = 'win32'
    let calls = 0
    permissions.chmod = () => {
      calls++
    }

    getConfig()
    expect(calls).to.equal(0)
    expect(mode(file)).to.equal(0o644)
    expect(lines).to.deep.equal([])
  })
})

describe('setHost', () => {
  afterEach(() => {
    delete process.env.DISCO_CONFIG_PATH
  })

  it('updates the host of an entry that has its own name', () => {
    useConfig([{name: 'srv', host: 'old.test'}])
    const disco = setHost('srv', 'new.test')
    expect(disco).to.deep.equal({name: 'srv', host: 'new.test', apiKey: 'k'})
    expect(getConfig().discos).to.deep.equal({srv: {name: 'srv', host: 'new.test', apiKey: 'k'}})
  })

  it('renames an entry that was named after its host, so --disco <host> keeps working', () => {
    useConfig([{name: 'old.test', host: 'old.test'}, {name: 'other', host: 'other.test'}])
    const disco = setHost('old.test', 'new.test')
    expect(disco).to.deep.equal({name: 'new.test', host: 'new.test', apiKey: 'k'})
    expect(Object.keys(getConfig().discos).sort()).to.deep.equal(['new.test', 'other'])
  })

  it('throws for an unknown entry and writes nothing', () => {
    useConfig([{name: 'srv', host: 'old.test'}])
    expect(() => setHost('nope', 'new.test')).to.throw('not in config')
    expect(getConfig().discos.srv.host).to.equal('old.test')
  })
})
