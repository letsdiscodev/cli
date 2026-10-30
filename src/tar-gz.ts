import {Readable, Transform, Writable} from 'node:stream'
import {pipeline} from 'node:stream/promises'

import * as tar from 'tar'

export class BadArchive extends Error {}

// copies source into sink, and reads the same bytes through a tar parser (which gunzips them
// itself) to nowhere. the gzip trailer carries a checksum and a length, so a stream that is cut
// short fails, and so does anything that is not a tar.gz. nothing is held in memory.
// a bad archive rejects with BadArchive; a source or sink that fails rejects with its own error
export async function copyVerified(source: Readable, sink: Writable): Promise<void> {
  // not strict: an odd entry is the daemon's business, only "not a whole tar.gz" is ours.
  // a volume full of zeros compresses far beyond tar's default ratio limit of 1000
  const parser = new tar.Parser({maxDecompressionRatio: Number.POSITIVE_INFINITY, onReadEntry: (entry) => entry.resume()})
  let bad: Error | undefined
  const parsed = new Promise<void>((resolve) => {
    parser.on('error', (error: Error) => {
      bad ??= error
      resolve()
    })
    parser.on('warn', (code: string, message: string) => {
      if (code === 'TAR_BAD_ARCHIVE') bad ??= new Error(message)
    })
    parser.on('end', resolve)
  })
  const tee = new Transform({
    transform(chunk, _encoding, callback) {
      // the parser's output is thrown away as it is produced, so it never pushes back
      parser.write(chunk)
      callback(null, chunk)
    },
    flush(callback) {
      parser.end()
      callback()
    },
  })
  await pipeline(source, tee, sink)
  await parsed
  if (bad) throw new BadArchive(bad.message)
}

export function devNull(): Writable {
  return new Writable({
    write(_chunk, _encoding, callback) {
      callback()
    },
  })
}
