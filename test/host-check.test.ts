import {expect} from '@oclif/test'

import {Addresses} from '../src/default-domain.js'
import {HostCheckError, checkNewHost} from '../src/host-check.js'

const table = (answers: Record<string, Addresses>) => async (name: string) => {
  if (!(name in answers)) throw Object.assign(new Error('nope'), {code: 'ENOTFOUND'})
  return answers[name]
}

const empty: Addresses = {a: [], aaaa: []}

async function reason(promise: Promise<void>): Promise<string> {
  try {
    await promise
  } catch (error) {
    expect(error).to.be.instanceOf(HostCheckError)
    return (error as Error).message
  }

  return 'no error'
}

describe('checkNewHost', () => {
  it('passes when the new host resolves exactly like the current one, in any order', async () => {
    const resolve = table({
      'old.test': {a: ['1.1.1.1', '2.2.2.2'], aaaa: ['::1']},
      'new.test': {a: ['2.2.2.2', '1.1.1.1'], aaaa: ['::1']},
    })
    await checkNewHost({currentHost: 'old.test', newHost: 'new.test', resolve})
  })

  it('fails with both addresses when the new host points elsewhere', async () => {
    const resolve = table({'old.test': {a: ['1.1.1.1'], aaaa: []}, 'new.test': {a: ['9.9.9.9'], aaaa: []}})
    const message = await reason(checkNewHost({currentHost: 'old.test', newHost: 'new.test', resolve}))
    expect(message).to.contain('new.test resolves to 9.9.9.9 but the server (old.test) is at 1.1.1.1')
    expect(message).to.contain('--force')
  })

  it('fails when only part of a round robin set matches', async () => {
    const resolve = table({'old.test': {a: ['1.1.1.1', '2.2.2.2'], aaaa: []}, 'new.test': {a: ['1.1.1.1'], aaaa: []}})
    expect(await reason(checkNewHost({currentHost: 'old.test', newHost: 'new.test', resolve}))).to.contain('resolves to 1.1.1.1 but')
  })

  it('fails when the new host has no record, telling which address to point it at', async () => {
    const resolve = table({'old.test': {a: ['1.1.1.1'], aaaa: []}, 'new.test': empty})
    const message = await reason(checkNewHost({currentHost: 'old.test', newHost: 'new.test', resolve}))
    expect(message).to.contain('new.test does not resolve. Add a DNS record pointing it at 1.1.1.1 first')
  })

  it('fails when the current host itself does not resolve', async () => {
    const resolve = table({'old.test': empty, 'new.test': {a: ['1.1.1.1'], aaaa: []}})
    expect(await reason(checkNewHost({currentHost: 'old.test', newHost: 'new.test', resolve}))).to.contain('old.test does not resolve')
  })

  it('fails with the code when a lookup errors', async () => {
    const resolve = table({'old.test': {a: ['1.1.1.1'], aaaa: []}})
    expect(await reason(checkNewHost({currentHost: 'old.test', newHost: 'new.test', resolve}))).to.contain('DNS lookup failed (ENOTFOUND)')
  })

  it('compares against a bare ip when the current host is one, v4 and v6', async () => {
    await checkNewHost({currentHost: '1.1.1.1', newHost: 'new.test', resolve: table({'new.test': {a: ['1.1.1.1'], aaaa: []}})})
    await checkNewHost({currentHost: '::1', newHost: 'new.test', resolve: table({'new.test': {a: [], aaaa: ['::1']}})})
    const message = await reason(
      checkNewHost({currentHost: '1.1.1.1', newHost: 'new.test', resolve: table({'new.test': {a: ['9.9.9.9'], aaaa: []}})}),
    )
    expect(message).to.contain('is at 1.1.1.1')
  })
})
