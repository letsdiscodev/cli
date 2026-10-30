import {expect} from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import {Readable, Writable} from 'node:stream'
import * as zlib from 'node:zlib'

import * as tar from 'tar'

import {BadArchive, copyVerified, devNull} from '../src/tar-gz.js'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'disco-tar-gz-'))
fs.writeFileSync(path.join(dir, 'random.bin'), Buffer.from(Array.from({length: 200 * 1024}, () => Math.floor(Math.random() * 256))))
fs.writeFileSync(path.join(dir, 'zeros.bin'), Buffer.alloc(32 * 1024 * 1024))
const archive = (name: string, files: string[]) => {
  const file = path.join(dir, name)
  tar.c({gzip: true, sync: true, file, cwd: dir}, files)
  return fs.readFileSync(file)
}

const whole = archive('random.tar.gz', ['random.bin'])
// gzips zeros about 1000:1, past tar's default decompression ratio limit
const zeros = archive('zeros.tar.gz', ['zeros.bin'])

const collect = () => {
  const parts: Buffer[] = []
  const sink = new Writable({
    write(chunk, _encoding, callback) {
      parts.push(chunk)
      callback()
    },
  })
  return {sink, bytes: () => Buffer.concat(parts)}
}

const chunks = (b: Buffer) => Readable.from([b.subarray(0, 1000), b.subarray(1000)])

const rejects = async (source: Readable, contains: string) => {
  const out = collect()
  let error: Error | undefined
  try {
    await copyVerified(source, out.sink)
  } catch (error_) {
    error = error_ as Error
  }

  expect(error, 'copyVerified did not reject').to.not.equal(undefined)
  expect(error).to.be.instanceOf(BadArchive)
  expect(error!.message).to.contain(contains)
}

describe('copyVerified', () => {
  it('copies a whole tar.gz to the sink, byte for byte', async () => {
    const out = collect()
    await copyVerified(chunks(whole), out.sink)
    expect(out.bytes().equals(whole)).to.equal(true)
  })

  it('accepts an archive that gzips beyond 1000:1, which tar refuses by default', async () => {
    const withDefaults = await new Promise<string>((resolve) => {
      const parser = new tar.Parser({onReadEntry: (entry) => entry.resume()})
      parser.on('error', (error: Error) => resolve(error.message))
      parser.on('end', () => resolve('accepted'))
      parser.end(zeros)
    })
    expect(withDefaults).to.contain('max decompression ratio exceeded')
    await copyVerified(chunks(zeros), devNull())
  })

  it('rejects an archive that ends early', () => rejects(chunks(whole.subarray(0, Math.floor(whole.length / 2))), 'unexpected end of file'))
  it('rejects a gzip that is not a tar', () => rejects(Readable.from([zlib.gzipSync(Buffer.from('hello'))]), 'Unrecognized archive format'))
  it('rejects plain text', () => rejects(Readable.from([Buffer.from('hello there, not an archive at all')]), 'Unrecognized archive format'))
  it('rejects empty input', () => rejects(Readable.from([]), 'Unrecognized archive format'))

  it('passes a source error through, not as a BadArchive', async () => {
    const source = new Readable({read() {}})
    source.push(whole.subarray(0, 1000))
    setImmediate(() => source.destroy(new Error('Premature close')))
    let error: Error | undefined
    try {
      await copyVerified(source, devNull())
    } catch (error_) {
      error = error_ as Error
    }

    expect(error).to.not.be.instanceOf(BadArchive)
    expect(error!.message).to.equal('Premature close')
  })
})
