// deploy --dir in-process, the network replaced: the exit code oclif raises is
// the real one, and the tarball the fake server receives is the real upload
import {expect, test} from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as tar from 'tar'

import {net} from '../../src/commands/deploy.js'

const configFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'disco-home-')), 'config.json')
fs.writeFileSync(configFile, JSON.stringify({discos: {fake: {name: 'fake', host: 'fake.test', apiKey: 'k'}}}))

const calls: {method: string; url: string; body: Buffer}[] = []
const original = {...net}
const fakeNet = () => {
  calls.length = 0
  net.request = (async (args: {method: string; url: string; bodyStream?: AsyncIterable<Buffer>}) => {
    // read the upload like a server would, before the command removes its temp file
    const chunks: Buffer[] = []
    if (args.bodyStream) for await (const chunk of args.bodyStream) chunks.push(chunk)
    calls.push({method: args.method, url: args.url, body: Buffer.concat(chunks)})
    return {json: async () => ({deployment: {number: 7}})}
  }) as typeof net.request
  net.readEventSource = (() => ({eventSource: {close() {}}, done: Promise.resolve()})) as unknown as typeof net.readEventSource
}

const restoreNet = () => Object.assign(net, original)

// the files (not directories) inside the uploaded tar.gz, sorted
function uploadedFiles(body: Buffer): string[] {
  const archive = path.join(os.tmpdir(), `disco-uploaded-${process.pid}-${calls.length}.tar.gz`)
  fs.writeFileSync(archive, body)
  const names: string[] = []
  tar.t({
    file: archive,
    sync: true,
    onReadEntry(entry) {
      if (entry.type === 'File') names.push(entry.path.replace(/^\.\//, ''))
    },
  })
  fs.rmSync(archive)
  return names.sort()
}

function appDir(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'disco-app-'))
  for (const [name, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), {recursive: true})
    fs.writeFileSync(path.join(dir, name), content)
  }

  return dir
}

const discoJson = '{"version":"1.0","services":{"web":{"port":8000}}}'

describe('deploy --dir', () => {
  const without = appDir({Dockerfile: 'FROM scratch\n'})

  test
    .env({DISCO_CONFIG_PATH: configFile})
    .do(fakeNet)
    .finally(restoreNet)
    .command(['deploy', '--project', 'app', '--dir', without, '--disco', 'fake'])
    .catch((error) => {
      expect((error as {oclif?: {exit?: number}}).oclif?.exit).to.equal(2)
      expect(error.message).to.contain('No disco.json')
    })
    .it('exits 2 and never talks to the server without a disco.json', () => {
      expect(calls).to.deep.equal([])
    })

  const plain = appDir({
    'disco.json': discoJson,
    Dockerfile: 'FROM scratch\n',
    '.env': 'SECRET=1\n',
    'app.log': 'log\n',
    '.git/HEAD': 'ref: refs/heads/main\n',
    'sub/notes.txt': 'notes\n',
  })

  test
    .env({DISCO_CONFIG_PATH: configFile})
    .do(fakeNet)
    .finally(restoreNet)
    .stdout()
    .command(['deploy', '--project', 'app', '--dir', plain, '--disco', 'fake'])
    .it('sends everything but .git when there is no .dockerignore or .gitignore', (ctx) => {
      expect(calls.map((c) => `${c.method} ${c.url}`)).to.deep.equal(['POST https://fake.test/api/projects/app/files'])
      expect(uploadedFiles(calls[0].body)).to.deep.equal(['.env', 'Dockerfile', 'app.log', 'disco.json', 'sub/notes.txt'])
      expect(ctx.stdout).to.contain('Sending 5 file(s)')
      expect(ctx.stdout).to.not.contain('skipping')
      expect(ctx.stdout).to.contain('Deploying app, version 7')
    })

  const withRules = appDir({
    'disco.json': discoJson,
    Dockerfile: 'FROM scratch\n',
    '.dockerignore': '# build context rules\n*.log\n!keep.log\nsecrets/\n',
    '.gitignore': '*.log\n.env\nnode_modules/\n',
    'app.py': 'print(1)\n',
    'app.log': 'log\n', // .dockerignore
    'keep.log': 'log\n', // .gitignore says no, .dockerignore re-includes it: sent
    'sub/deep.log': 'log\n', // .dockerignore *.log is root only, .gitignore *.log is any depth
    '.env': 'SECRET=1\n', // .gitignore only
    'node_modules/x.js': '1\n', // .gitignore directory
    'secrets/key': 'k\n', // .dockerignore directory
    '.git/HEAD': 'ref: refs/heads/main\n',
    'sub/notes.txt': 'notes\n',
  })

  test
    .env({DISCO_CONFIG_PATH: configFile})
    .do(fakeNet)
    .finally(restoreNet)
    .stdout()
    .command(['deploy', '--project', 'app', '--dir', withRules, '--disco', 'fake'])
    .it('leaves out what .dockerignore lists, then what .gitignore lists, and sends the rest', (ctx) => {
      expect(uploadedFiles(calls[0].body)).to.deep.equal([
        '.dockerignore',
        '.gitignore',
        'Dockerfile',
        'app.py',
        'disco.json',
        'keep.log',
        'sub/notes.txt',
      ])
      expect(ctx.stdout).to.contain('Sending 7 file(s)')
      expect(ctx.stdout).to.contain('(skipping what .dockerignore and .gitignore list)')
    })
})
