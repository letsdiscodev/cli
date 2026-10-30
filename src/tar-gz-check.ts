import * as fs from 'node:fs'
import * as path from 'node:path'
import {Readable} from 'node:stream'
import * as zlib from 'node:zlib'

import * as tar from 'tar'

export function checkGzipMagic(buf: Buffer): void {
  if (buf.length === 0) {
    throw new Error('Input is empty.')
  }

  if (buf.length < 2 || buf[0] !== 0x1f || buf[1] !== 0x8b) {
    throw new Error('Input does not look like a gzip file (expected a .tar.gz volume export).')
  }
}

function checkTarUstar(block: Buffer): void {
  if (block.length < 512) {
    throw new Error('Input is not a valid tar.gz archive (tar header too short).')
  }

  if (block.subarray(257, 262).toString('ascii') !== 'ustar') {
    throw new Error('Input is not a valid tar.gz archive (missing tar ustar header).')
  }
}

export function checkTarGzFile(filePath: string): void {
  const resolved = path.resolve(filePath)
  const fd = fs.openSync(resolved, 'r')
  try {
    const head = Buffer.alloc(2)
    const n = fs.readSync(fd, head, 0, 2, 0)
    checkGzipMagic(head.subarray(0, n))
  } finally {
    fs.closeSync(fd)
  }

  try {
    tar.t({file: resolved, sync: true, strict: true})
  } catch (error) {
    throw new Error(`Input is not a valid tar.gz archive (${(error as Error).message}).`)
  }
}

export async function openValidatedStdin(): Promise<Readable> {
  const parts: Buffer[] = []
  let decompressed = Buffer.alloc(0)
  const gunzip = zlib.createGunzip()
  gunzip.on('data', (chunk: Buffer) => {
    decompressed = Buffer.concat([decompressed, chunk])
  })

  await new Promise<void>((resolve, reject) => {
    const gunzipErrors: Error[] = []
    gunzip.on('error', (err) => gunzipErrors.push(err))

    const fail = (error: Error) => {
      gunzip.destroy()
      reject(error)
    }

    const tryRead = () => {
      if (gunzipErrors.length > 0) {
        fail(new Error(`Input is not a valid tar.gz archive (${gunzipErrors[0].message}).`))
        return
      }

      if (decompressed.length >= 512) {
        try {
          checkTarUstar(decompressed.subarray(0, 512))
          gunzip.destroy()
          resolve()
        } catch (error) {
          fail(error as Error)
        }

        return
      }

      const buf = Buffer.alloc(16 * 1024)
      let n: number
      try {
        n = fs.readSync(0, buf, 0, buf.length, null)
      } catch (error) {
        fail(error as Error)
        return
      }

      if (n === 0) {
        fail(new Error('Input ended before a tar header could be read.'))
        return
      }

      const slice = buf.subarray(0, n)
      if (parts.length === 0) {
        try {
          checkGzipMagic(slice.subarray(0, Math.min(slice.length, 2)))
        } catch (error) {
          fail(error as Error)
          return
        }
      }

      parts.push(slice)
      if (gunzip.write(slice)) {
        setImmediate(tryRead)
      } else {
        gunzip.once('drain', tryRead)
      }
    }

    tryRead()
  })

  const rest = fs.createReadStream('', {fd: 0, autoClose: false})
  return Readable.from([Buffer.concat(parts), rest])
}
