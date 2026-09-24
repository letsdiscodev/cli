// deploy --dir in-process, the network replaced: the exit code oclif raises is the real one

import {expect, test} from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import {net} from '../../src/commands/deploy.js'

const configFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'disco-home-')), 'config.json')
fs.writeFileSync(
  configFile,
  JSON.stringify({discos: {fake: {name: 'fake', host: 'fake.test', apiKey: 'k'}}}),
)

const calls: {method: string; url: string; bytes: number}[] = []
const original = {...net}
const fakeNet = () => {
  calls.length = 0
  net.request = (async (args: {method: string; url: string; bodyStream?: AsyncIterable<Buffer>}) => {
    // read the upload like a server would, before the command removes its temp file
    let bytes = 0
    if (args.bodyStream) for await (const chunk of args.bodyStream) bytes += chunk.length
    calls.push({method: args.method, url: args.url, bytes})
    return {json: async () => ({deployment: {number: 7}})}
  }) as typeof net.request
  net.readEventSource = (() => ({eventSource: {close() {}}, done: Promise.resolve()})) as unknown as typeof net.readEventSource
}

const restoreNet = () => Object.assign(net, original)

function appDir(withDiscoJson: boolean): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'disco-app-'))
  fs.writeFileSync(path.join(dir, 'Dockerfile'), 'FROM scratch\n')
  if (withDiscoJson) fs.writeFileSync(path.join(dir, 'disco.json'), '{"version":"1.0","services":{"web":{"port":8000}}}')
  return dir
}

describe('deploy --dir', () => {
  const without = appDir(false)
  const withIt = appDir(true)

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

  test
    .env({DISCO_CONFIG_PATH: configFile})
    .do(fakeNet)
    .finally(restoreNet)
    .stdout()
    .command(['deploy', '--project', 'app', '--dir', withIt, '--disco', 'fake'])
    .it('uploads the directory and exits 0 with a disco.json', (ctx) => {
      expect(calls.map((c) => `${c.method} ${c.url}`)).to.deep.equal(['POST https://fake.test/api/projects/app/files'])
      expect(calls[0].bytes).to.be.greaterThan(0)
      expect(ctx.stdout).to.contain('Deploying app, version 7')
    })
})
