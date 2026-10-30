import {expect} from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as zlib from 'node:zlib'

import * as tar from 'tar'

import {checkGzipMagic, checkTarGzFile} from '../src/tar-gz-check.js'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'disco-tar-gz-'))

describe('tar-gz-check', () => {
  it('accepts gzip magic bytes', () => {
    expect(() => checkGzipMagic(Buffer.from([0x1f, 0x8b, 0x08]))).not.to.throw()
  })

  it('rejects empty input', () => {
    expect(() => checkGzipMagic(Buffer.alloc(0))).to.throw('empty')
  })

  it('rejects non-gzip data', () => {
    expect(() => checkGzipMagic(Buffer.from('not gzip'))).to.throw('does not look like a gzip file')
  })

  it('accepts a tar.gz file', () => {
    const payload = path.join(dir, 'payload.txt')
    fs.writeFileSync(payload, 'payload')
    const archive = path.join(dir, 'good.tar.gz')
    tar.c({gzip: true, sync: true, file: archive, cwd: dir}, ['payload.txt'])
    expect(() => checkTarGzFile(archive)).not.to.throw()
  })

  it('rejects plain text', () => {
    const bad = path.join(dir, 'plain.txt')
    fs.writeFileSync(bad, 'hello')
    expect(() => checkTarGzFile(bad)).to.throw('does not look like a gzip file')
  })

  it('rejects gzip that is not tar', () => {
    const bad = path.join(dir, 'not-tar.gz')
    fs.writeFileSync(bad, zlib.gzipSync(Buffer.from('hello')))
    expect(() => checkTarGzFile(bad)).to.throw('not a valid tar.gz archive')
  })
})
