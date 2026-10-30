import {expect, test} from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import {Readable} from 'node:stream'
import * as zlib from 'node:zlib'

import * as tar from 'tar'

import {net} from '../../src/commands/volumes/import.js'

const configFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'disco-home-')), 'config.json')
fs.writeFileSync(configFile, JSON.stringify({discos: {fake: {name: 'fake', host: 'fake.test', apiKey: 'k'}}}))

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'disco-volume-import-test-'))
fs.writeFileSync(path.join(dir, 'data.bin'), Buffer.from(Array.from({length: 100 * 1024}, () => Math.floor(Math.random() * 256))))
const good = path.join(dir, 'volume.tar.gz')
tar.c({gzip: true, sync: true, file: good, cwd: dir}, ['data.bin'])
const whole = fs.readFileSync(good)
const cut = path.join(dir, 'cut.tar.gz')
fs.writeFileSync(cut, whole.subarray(0, Math.floor(whole.length / 2)))
const text = path.join(dir, 'volume.txt')
fs.writeFileSync(text, 'not an archive')
const notTar = path.join(dir, 'not-tar.gz')
fs.writeFileSync(notTar, zlib.gzipSync(Buffer.from('hello')))

// what the fake daemon received: undefined when no upload was made
let upload: {contentLength: string | undefined; body: Buffer} | undefined
const original = {...net}
const fakeNet = () => {
  upload = undefined
  net.request = (async (opts: {method: string; bodyStream: Readable; extraHeaders?: Record<string, string>}) => {
    expect(opts.method).to.equal('PUT')
    const parts: Buffer[] = []
    for await (const chunk of opts.bodyStream) parts.push(chunk as Buffer)
    upload = {contentLength: opts.extraHeaders?.['Content-Length'], body: Buffer.concat(parts)}
    return {status: 200, json: async () => ({})}
  }) as unknown as typeof net.request
}

const restoreNet = () => Object.assign(net, original)
const spoolDirs = () => fs.readdirSync(os.tmpdir()).filter((name) => name.startsWith('disco-volume-import-') && !name.startsWith('disco-volume-import-test-')).length

// stand in for a pipe on stdin: not a tty, data arriving in two chunks
const realStdin = process.stdin
const setStdin = (value: Readable) => Object.defineProperty(process, 'stdin', {value, configurable: true, writable: false})
const pipeIn = (data: Buffer) => () => setStdin(Readable.from([data.subarray(0, 1000), data.subarray(1000)]))
const restoreStdin = () => setStdin(realStdin)

const run = () =>
  test
  .env({DISCO_CONFIG_PATH: configFile})
  .do(fakeNet)
  .finally(() => {
    restoreNet()
    restoreStdin()
  })
const refused = (contains: string) => (error: Error) => {
  expect((error as {oclif?: {exit?: number}}).oclif?.exit).to.equal(2)
  expect(error.message).to.contain(contains)
  expect(upload).to.equal(undefined)
}

describe('volumes:import', () => {
  run()
    .command(['volumes:import', '--project', 'app', '--volume', 'v', '--input', good, '--disco', 'fake'])
    .it('uploads a whole --input file with its length', () => {
      expect(upload?.contentLength).to.equal(whole.length.toString())
      expect(upload?.body.equals(whole)).to.equal(true)
    })

  run()
    .command(['volumes:import', '--project', 'app', '--volume', 'v', '--input', text, '--disco', 'fake'])
    .catch(refused('is not a tar.gz volume export'))
    .it('refuses a plain text --input file, nothing is uploaded')

  run()
    .command(['volumes:import', '--project', 'app', '--volume', 'v', '--input', cut, '--disco', 'fake'])
    .catch(refused('unexpected end of file'))
    .it('refuses a truncated --input archive, nothing is uploaded')

  run()
    .command(['volumes:import', '--project', 'app', '--volume', 'v', '--input', notTar, '--disco', 'fake'])
    .catch(refused('Unrecognized archive format'))
    .it('refuses a gzip --input that is not a tar, nothing is uploaded')

  run()
    .command(['volumes:import', '--project', 'app', '--volume', 'v', '--input', path.join(dir, 'missing.tar.gz'), '--disco', 'fake'])
    .catch(refused('File not found'))
    .it('says when the --input file does not exist')

  const before = spoolDirs()
  run()
    .do(pipeIn(whole))
    .command(['volumes:import', '--project', 'app', '--volume', 'v', '--disco', 'fake'])
    .it('uploads whole piped stdin with its length, and leaves no spool file behind', () => {
      expect(upload?.contentLength).to.equal(whole.length.toString())
      expect(upload?.body.equals(whole)).to.equal(true)
      expect(spoolDirs()).to.equal(before)
    })

  run()
    .do(pipeIn(whole.subarray(0, Math.floor(whole.length / 2))))
    .command(['volumes:import', '--project', 'app', '--volume', 'v', '--disco', 'fake'])
    .catch(refused('stdin is not a tar.gz volume export'))
    .it('refuses truncated stdin, nothing is uploaded, no spool file left behind', () => {
      expect(spoolDirs()).to.equal(before)
    })

  run()
    .do(pipeIn(Buffer.from('hello')))
    .command(['volumes:import', '--project', 'app', '--volume', 'v', '--disco', 'fake'])
    .catch(refused('Unrecognized archive format'))
    .it('refuses plain text on stdin')

  run()
    .do(pipeIn(Buffer.alloc(0)))
    .command(['volumes:import', '--project', 'app', '--volume', 'v', '--disco', 'fake'])
    .catch(refused('Unrecognized archive format'))
    .it('refuses empty stdin')
})
