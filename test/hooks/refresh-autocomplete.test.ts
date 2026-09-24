// the update hook called directly with a stand-in config
import {expect} from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import hook, {autocompleteFolder} from '../../src/hooks/update/refresh-autocomplete.js'

type Options = Parameters<typeof hook>[1]

function fakeConfig(cacheDir: string, runCommand: (id: string) => Promise<unknown>) {
  const ran: string[] = []
  const config = {
    cacheDir,
    async runCommand(id: string) {
      ran.push(id)
      return runCommand(id)
    },
  }
  return {config, ran}
}

async function runHook(config: unknown): Promise<void> {
  await hook.call({} as ThisParameterType<typeof hook>, {channel: 'stable', version: '0.5.68', config} as unknown as Options)
}

describe('update hook: refresh autocomplete', () => {
  it('rebuilds the completion files when the user set autocomplete up', async () => {
    const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'disco-cache-'))
    fs.mkdirSync(autocompleteFolder(cacheDir), {recursive: true})
    const {config, ran} = fakeConfig(cacheDir, async () => {})
    await runHook(config)
    expect(ran).to.deep.equal(['autocomplete:create'])
  })

  it('does nothing when autocomplete was never set up', async () => {
    const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'disco-cache-'))
    const {config, ran} = fakeConfig(cacheDir, async () => {})
    await runHook(config)
    expect(ran).to.deep.equal([])
  })

  it('swallows a failing rebuild so the update itself succeeds', async () => {
    const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'disco-cache-'))
    fs.mkdirSync(autocompleteFolder(cacheDir), {recursive: true})
    const {config, ran} = fakeConfig(cacheDir, async () => {
      throw new Error('no such command')
    })
    await runHook(config)
    expect(ran).to.deep.equal(['autocomplete:create'])
  })
})
