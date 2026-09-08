import * as fs from 'node:fs'
import * as path from 'node:path'

// Which files of a directory to send with `disco deploy --dir`, following the
// rules of the directory's .dockerignore (the same file docker applies when it
// builds the image on the server), so the upload is not bigger than the build
// context. `.git` is never sent.
//
// .dockerignore rules: one pattern per line, matched against paths relative to
// the directory; `*` and `?` do not cross `/`, `**` matches any number of
// directories, `!` re-includes, the last matching pattern wins, and a pattern
// matching a directory matches everything under it.

interface Pattern {
  negate: boolean
  regex: RegExp
}

const ALWAYS_IGNORED = new Set(['.git'])

function globToRegex(pattern: string): RegExp {
  let out = '^'
  let i = 0
  while (i < pattern.length) {
    if (pattern.startsWith('**/', i)) {
      out += '(?:.*/)?'
      i += 3
      continue
    }

    if (pattern.startsWith('**', i)) {
      out += '.*'
      i += 2
      continue
    }

    const c = pattern[i]
    const end = c === '[' ? pattern.indexOf(']', i) : -1
    if (end !== -1) {
      out += pattern.slice(i, end + 1)
      i = end + 1
      continue
    }

    out += globChar(c)
    i += 1
  }

  return new RegExp(out + '$')
}

function globChar(c: string): string {
  switch (c) {
    case '*': {
      return '[^/]*'
    }

    case '?': {
      return '[^/]'
    }

    default: {
      return c.replaceAll(/[$()+.[\\^{|}]/g, String.raw`\$&`)
    }
  }
}

export function parseDockerignore(content: string): Pattern[] {
  const patterns: Pattern[] = []
  for (const rawLine of content.split('\n')) {
    let line = rawLine.trim()
    if (line === '' || line.startsWith('#')) {
      continue
    }

    let negate = false
    if (line.startsWith('!')) {
      negate = true
      line = line.slice(1).trim()
    }

    line = line.replace(/^(\.\/|\/)+/, '').replace(/\/+$/, '')
    if (line === '') {
      continue
    }

    patterns.push({negate, regex: globToRegex(line)})
  }

  return patterns
}

function parents(relativePath: string): string[] {
  const parts = relativePath.split('/')
  const out: string[] = []
  for (let i = 1; i < parts.length; i++) {
    out.push(parts.slice(0, i).join('/'))
  }

  return out
}

export function isIgnored(patterns: Pattern[], relativePath: string): boolean {
  const candidates = [relativePath, ...parents(relativePath)]
  if (candidates.some((c) => ALWAYS_IGNORED.has(c))) {
    return true
  }

  let ignored = false
  for (const pattern of patterns) {
    if (candidates.some((c) => pattern.regex.test(c))) {
      ignored = !pattern.negate
    }
  }

  return ignored
}

export function loadDockerignore(directory: string): Pattern[] {
  const file = path.join(directory, '.dockerignore')
  if (!fs.existsSync(file)) {
    return []
  }

  return parseDockerignore(fs.readFileSync(file, 'utf8'))
}
