import {expect, test} from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import {Readable} from 'node:stream'
import * as zlib from 'node:zlib'

import {net} from '../../src/commands/volumes/export.js'

const configFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'disco-home-')), 'config.json')
fs.writeFileSync(configFile, JSON.stringify({discos: {fake: {name: 'fake', host: 'fake.test', apiKey: 'k'}}}))

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'disco-volume-'))
const output = path.join(outDir, 'volume.tar.gz')

// a gzip stream of 200 KiB of random bytes, and the first half of it (tar's death partway)
const whole = zlib.gzipSync(Buffer.from(Array.from({length: 200 * 1024}, () => Math.floor(Math.random() * 256))))
const cut = whole.subarray(0, Math.floor(whole.length / 2))

const original = {...net}
const fakeNet = (body: () => Readable) => () => {
  net.request = (async () => ({status: 200, body: body()})) as unknown as typeof net.request
}

const restoreNet = () => Object.assign(net, original)
const clean = () => {
  if (fs.existsSync(output)) fs.unlinkSync(output)
}

const run = (body: () => Readable) =>
  test.env({DISCO_CONFIG_PATH: configFile}).do(clean).do(fakeNet(body)).finally(restoreNet).stdout()

const chunks = (b: Buffer) => Readable.from([b.subarray(0, 1000), b.subarray(1000)])
// a body that breaks off: some bytes, then the error node-fetch raises when the server closes early
const brokenOff = () => {
  const r = new Readable({read() {}})
  r.push(cut.subarray(0, 1000))
  setImmediate(() => r.destroy(new Error('Premature close')))
  return r
}

describe('volumes:export', () => {
  run(() => chunks(whole))
    .command(['volumes:export', '--project', 'app', '--volume', 'v', '--output', output, '--disco', 'fake'])
    .it('writes a complete archive and says so', (ctx) => {
      expect(ctx.stdout).to.equal(`Volume exported to ${output}\n`)
      expect(fs.readFileSync(output).equals(whole)).to.equal(true)
      expect(fs.existsSync(`${output}.part`)).to.equal(false)
    })

  run(() => chunks(cut))
    .command(['volumes:export', '--project', 'app', '--volume', 'v', '--output', output, '--disco', 'fake'])
    .catch((error) => {
      expect((error as {oclif?: {exit?: number}}).oclif?.exit).to.equal(2)
      expect(error.message).to.contain('not complete')
      expect(fs.existsSync(output)).to.equal(false)
      expect(fs.existsSync(`${output}.part`)).to.equal(false)
    })
    .it('refuses a truncated archive (a download that ended cleanly but short) and writes nothing')

  run(brokenOff)
    .command(['volumes:export', '--project', 'app', '--volume', 'v', '--output', output, '--disco', 'fake'])
    .catch((error) => {
      expect((error as {oclif?: {exit?: number}}).oclif?.exit).to.equal(2)
      expect(error.message).to.contain('ended before the archive was complete')
      expect(error.message).to.contain('Premature close')
      expect(fs.existsSync(output)).to.equal(false)
      expect(fs.existsSync(`${output}.part`)).to.equal(false)
    })
    .it('fails when the download breaks off (the daemon ending the response early) and writes nothing')
})
