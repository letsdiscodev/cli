import dockerignoreModule from '@balena/dockerignore'
import gitignore from 'ignore'
import * as fs from 'node:fs'
import * as path from 'node:path'

// the package is CommonJS (`module.exports = factory`, no `default`): at
// runtime the import is the factory itself, the types say otherwise
const dockerignore = dockerignoreModule as unknown as typeof dockerignoreModule.default

// Which files `disco deploy --dir` leaves out of the upload. The directory's
// .dockerignore (the same file docker applies when it builds the image on the
// server) decides first, including its `!` re-includes; where it says nothing,
// the directory's .gitignore applies, so the upload matches what a git push
// would have carried. Only the two files at the root of the directory are
// read, nested ones are not. `.git` is never sent.

export interface UploadFilter {
  ignores(relativePath: string, isDirectory: boolean): boolean
  ruleFiles: string[]
}

function readLines(file: string): string[] | undefined {
  if (!fs.existsSync(file)) {
    return undefined
  }

  return fs.readFileSync(file, 'utf8').split('\n')
}

export function loadUploadFilter(directory: string): UploadFilter {
  const dockerLines = readLines(path.join(directory, '.dockerignore'))
  const gitLines = readLines(path.join(directory, '.gitignore'))
  const docker = dockerLines && dockerignore().add(dockerLines)
  // what .dockerignore re-includes with `!` is sent whatever .gitignore says
  const reincluded =
    dockerLines &&
    dockerignore().add(
      dockerLines
        .map((line) => line.trim())
        .filter((line) => line.startsWith('!'))
        .map((line) => line.slice(1).trim()),
    )
  const git = gitLines && gitignore().add(gitLines)
  const ruleFiles: string[] = []
  if (dockerLines) ruleFiles.push('.dockerignore')
  if (gitLines) ruleFiles.push('.gitignore')

  return {
    ruleFiles,
    ignores(relativePath, isDirectory) {
      if (relativePath === '.git' || relativePath.startsWith('.git/')) {
        return true
      }

      if (docker?.ignores(relativePath)) {
        return true
      }

      if (reincluded?.ignores(relativePath)) {
        return false
      }

      // gitignore needs the trailing slash to apply directory-only patterns like `dist/`
      return git?.ignores(isDirectory ? `${relativePath}/` : relativePath) ?? false
    },
  }
}
