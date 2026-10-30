import {expect, test} from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import * as tar from 'tar'

import {net} from '../../src/commands/volumes/import.js'

const configFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'disco-home-')), 'config.json')
fs.writeFileSync(configFile, JSON.stringify({discos: {fake: {name: 'fake', host: 'fake.test', apiKey: 'k'}}}))

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'disco-volume-import-'))
const payload = path.join(dir, 'data.txt')
fs.writeFileSync(payload, 'volume data')
const good = path.join(dir, 'volume.tar.gz')
tar.c({gzip: true, sync: true, file: good, cwd: dir}, ['data.txt'])
const bad = path.join(dir, 'volume.txt')
fs.writeFileSync(bad, 'not an archive')

const original = {...net}
const restoreNet = () => Object.assign(net, original)

describe('volumes:import', () => {
  let uploadCalled = false

  test
    .env({DISCO_CONFIG_PATH: configFile})
    .do(() => {
      uploadCalled = false
      net.request = (async (opts) => {
        uploadCalled = true
        expect(opts.method).to.equal('PUT')
        expect(opts.bodyStream).to.not.equal(undefined)
        return {status: 200, json: async () => ({})}
      }) as unknown as typeof net.request
    })
    .finally(restoreNet)
    .command(['volumes:import', '--project', 'app', '--volume', 'v', '--input', good, '--disco', 'fake'])
    .it('uploads a validated tar.gz file', () => {
      expect(uploadCalled).to.equal(true)
    })

  test
    .env({DISCO_CONFIG_PATH: configFile})
    .command(['volumes:import', '--project', 'app', '--volume', 'v', '--input', bad, '--disco', 'fake'])
    .catch((error) => {
      expect((error as {oclif?: {exit?: number}}).oclif?.exit).to.equal(2)
      expect(error.message).to.contain('does not look like a gzip file')
    })
    .it('refuses a non-gzip --input file before uploading')
})
