import {expect} from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import {getConfig, setHost} from '../src/config.js'

function useConfig(discos: {name: string; host: string}[]): void {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'disco-home-')), 'config.json')
  const entries = Object.fromEntries(discos.map((d) => [d.name, {...d, apiKey: 'k'}]))
  fs.writeFileSync(file, JSON.stringify({discos: entries}))
  process.env.DISCO_CONFIG_PATH = file
}

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
