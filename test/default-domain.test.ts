import {expect} from '@oclif/test'

import {
  Addresses,
  DefaultDomainError,
  MAX_LABEL_LENGTH,
  chooseDefaultDomain,
  createWithFreeDomain,
  domainCandidates,
  hostnameLabel,
} from '../src/default-domain.js'
import {isDomainTaken} from '../src/commands/projects/add.js'

// every hostname here is invented; no test touches real dns or a real server
const HOST = 'happy-river-12345.example.test'

function fakeResolve(table: Record<string, Addresses | Error>) {
  const calls: string[] = []
  const resolve = async (name: string): Promise<Addresses> => {
    calls.push(name)
    const entry = table[name]
    if (entry === undefined) {
      return {a: [], aaaa: []}
    }

    if (entry instanceof Error) {
      throw entry
    }

    return entry
  }

  return {calls, resolve}
}

function codeError(code: string): Error {
  const error = new Error(code) as {code: string} & Error
  error.code = code
  return error
}

async function reasonOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise
  } catch (error) {
    expect(error).to.be.instanceOf(DefaultDomainError)
    return (error as DefaultDomainError).reason
  }

  throw new Error('expected a DefaultDomainError')
}

describe('hostnameLabel', () => {
  it('keeps a plain name', () => {
    expect(hostnameLabel('myblog')).to.equal('myblog')
  })
  it('strips leading and trailing hyphens', () => {
    expect(hostnameLabel('foo-')).to.equal('foo')
    expect(hostnameLabel('-foo-')).to.equal('foo')
  })
  it('collapses repeated hyphens', () => {
    expect(hostnameLabel('a--b')).to.equal('a-b')
    expect(hostnameLabel('a--')).to.equal('a')
    expect(hostnameLabel('--a--b--')).to.equal('a-b')
    expect(hostnameLabel('a---b--c')).to.equal('a-b-c')
  })
  it('keeps exactly 63 characters', () => {
    const name = 'a'.repeat(MAX_LABEL_LENGTH)
    expect(hostnameLabel(name)).to.equal(name)
  })
  it('truncates 70 characters to 63 and strips a trailing hyphen left by the cut', () => {
    expect(hostnameLabel('b'.repeat(70))).to.equal('b'.repeat(63))
    const name = 'c'.repeat(62) + '-' + 'd'.repeat(7)
    expect(hostnameLabel(name)).to.equal('c'.repeat(62))
  })
  it('lowercases', () => {
    expect(hostnameLabel('MyBlog')).to.equal('myblog')
  })
})

describe('domainCandidates', () => {
  it('is the label then -2 .. -5', () => {
    expect(domainCandidates('blog', HOST)).to.deep.equal([
      `blog.${HOST}`,
      `blog-2.${HOST}`,
      `blog-3.${HOST}`,
      `blog-4.${HOST}`,
      `blog-5.${HOST}`,
    ])
  })
  it('re-truncates a 63 character label so the suffix fits', () => {
    const label = 'e'.repeat(63)
    const candidates = domainCandidates(label, HOST)
    expect(candidates[1]).to.equal(`${'e'.repeat(61)}-2.${HOST}`)
    for (const c of candidates) {
      expect(c.split('.')[0].length).to.be.at.most(MAX_LABEL_LENGTH)
    }
  })
  it('does not leave a double hyphen when the cut lands on a hyphen', () => {
    const label = 'f'.repeat(61) + '-g'
    expect(domainCandidates(label, HOST)[1]).to.equal(`${'f'.repeat(61)}-2.${HOST}`)
  })
})

describe('chooseDefaultDomain', () => {
  it('returns <label>.<host> when the wildcard resolves like the host', async () => {
    const {calls, resolve} = fakeResolve({
      [HOST]: {a: ['203.0.113.10'], aaaa: []},
      [`blog.${HOST}`]: {a: ['203.0.113.10'], aaaa: []},
    })
    expect(await chooseDefaultDomain({name: 'blog', host: HOST, resolve})).to.equal(`blog.${HOST}`)
    expect(calls.sort()).to.deep.equal([`blog.${HOST}`, HOST].sort())
  })
  it('applies the label transform before resolving', async () => {
    const {resolve} = fakeResolve({
      [HOST]: {a: ['203.0.113.10'], aaaa: []},
      [`a-b.${HOST}`]: {a: ['203.0.113.10'], aaaa: []},
    })
    expect(await chooseDefaultDomain({name: 'A--b-', host: HOST, resolve})).to.equal(`a-b.${HOST}`)
  })
  it('candidate NXDOMAIN -> no wildcard', async () => {
    const {resolve} = fakeResolve({[HOST]: {a: ['203.0.113.10'], aaaa: []}})
    const reason = await reasonOf(chooseDefaultDomain({name: 'blog', host: HOST, resolve}))
    expect(reason).to.equal(`${HOST} has no wildcard DNS for blog.${HOST}`)
  })
  it('candidate resolving elsewhere -> not the same address', async () => {
    const {resolve} = fakeResolve({
      [HOST]: {a: ['203.0.113.10'], aaaa: []},
      [`blog.${HOST}`]: {a: ['198.51.100.7'], aaaa: []},
    })
    const reason = await reasonOf(chooseDefaultDomain({name: 'blog', host: HOST, resolve}))
    expect(reason).to.equal(`blog.${HOST} does not resolve to the same address as ${HOST}`)
  })
  it('round robin: same set in another order passes', async () => {
    const {resolve} = fakeResolve({
      [HOST]: {a: ['203.0.113.10', '203.0.113.11'], aaaa: []},
      [`blog.${HOST}`]: {a: ['203.0.113.11', '203.0.113.10', '203.0.113.10'], aaaa: []},
    })
    expect(await chooseDefaultDomain({name: 'blog', host: HOST, resolve})).to.equal(`blog.${HOST}`)
  })
  it('round robin: a partial subset fails', async () => {
    const {resolve} = fakeResolve({
      [HOST]: {a: ['203.0.113.10', '203.0.113.11'], aaaa: []},
      [`blog.${HOST}`]: {a: ['203.0.113.10'], aaaa: []},
    })
    const reason = await reasonOf(chooseDefaultDomain({name: 'blog', host: HOST, resolve}))
    expect(reason).to.contain('does not resolve to the same address')
  })
  it('ipv4 only on both sides passes, ipv6 only on both sides passes', async () => {
    const v6 = fakeResolve({
      [HOST]: {a: [], aaaa: ['2001:db8::1']},
      [`blog.${HOST}`]: {a: [], aaaa: ['2001:DB8::1']},
    })
    expect(await chooseDefaultDomain({name: 'blog', host: HOST, resolve: v6.resolve})).to.equal(`blog.${HOST}`)
  })
  it('host has AAAA, candidate has not -> fails', async () => {
    const {resolve} = fakeResolve({
      [HOST]: {a: ['203.0.113.10'], aaaa: ['2001:db8::1']},
      [`blog.${HOST}`]: {a: ['203.0.113.10'], aaaa: []},
    })
    const reason = await reasonOf(chooseDefaultDomain({name: 'blog', host: HOST, resolve}))
    expect(reason).to.contain('does not resolve to the same address')
  })
  it('host that does not resolve at all -> its own reason', async () => {
    const {resolve} = fakeResolve({[`blog.${HOST}`]: {a: ['203.0.113.10'], aaaa: []}})
    const reason = await reasonOf(chooseDefaultDomain({name: 'blog', host: HOST, resolve}))
    expect(reason).to.equal(`${HOST} does not resolve`)
  })
  it('resolver error -> DNS lookup failed (code)', async () => {
    for (const code of ['ETIMEOUT', 'ESERVFAIL', 'ECANCELLED']) {
      const {resolve} = fakeResolve({[HOST]: codeError(code), [`blog.${HOST}`]: {a: ['203.0.113.10'], aaaa: []}})
      // eslint-disable-next-line no-await-in-loop
      const reason = await reasonOf(chooseDefaultDomain({name: 'blog', host: HOST, resolve}))
      expect(reason).to.equal(`DNS lookup failed (${code})`)
    }
  })
  it('resolver timeout (AbortError) -> DNS lookup failed (AbortError)', async () => {
    const abort = new Error('took too long')
    abort.name = 'AbortError'
    const {resolve} = fakeResolve({[HOST]: {a: ['203.0.113.10'], aaaa: []}, [`blog.${HOST}`]: abort})
    const reason = await reasonOf(chooseDefaultDomain({name: 'blog', host: HOST, resolve}))
    expect(reason).to.equal('DNS lookup failed (AbortError)')
  })
  it('a name that is only hyphens -> its own reason, no lookup', async () => {
    const {calls, resolve} = fakeResolve({})
    const reason = await reasonOf(chooseDefaultDomain({name: '---', host: HOST, resolve}))
    expect(reason).to.contain('nothing usable')
    expect(calls).to.deep.equal([])
  })
  it('candidate longer than 253 characters -> its own reason, no lookup', async () => {
    const {calls, resolve} = fakeResolve({})
    const longHost = [...Array.from({length: 5}, () => 'h'.repeat(60)), 'test'].join('.')
    const reason = await reasonOf(chooseDefaultDomain({name: 'blog', host: longHost, resolve}))
    expect(reason).to.contain('longer than 253')
    expect(calls).to.deep.equal([])
  })
  it('the error message tells the user what to pass instead', async () => {
    const {resolve} = fakeResolve({[HOST]: {a: ['203.0.113.10'], aaaa: []}})
    try {
      await chooseDefaultDomain({name: 'blog', host: HOST, resolve})
    } catch (error) {
      expect((error as Error).message).to.equal(
        `Could not pick a domain for blog: ${HOST} has no wildcard DNS for blog.${HOST}.\n` +
          'Pass --domain <your.domain>, or --no-domain for a project without a URL.',
      )
      return
    }

    throw new Error('expected an error')
  })
})

function fakeCreate(taken: string[]) {
  const attempts: string[] = []
  const create = async (domain: string) => {
    attempts.push(domain)
    return taken.includes(domain) ? ({status: 'domain-taken'} as const) : ({status: 'created', data: {domain}} as const)
  }

  return {attempts, create}
}

describe('createWithFreeDomain', () => {
  it('creates with the candidate when it is free', async () => {
    const {attempts, create} = fakeCreate([])
    const result = await createWithFreeDomain({name: 'blog', host: HOST, domain: `blog.${HOST}`, create})
    expect(result.domain).to.equal(`blog.${HOST}`)
    expect(attempts).to.deep.equal([`blog.${HOST}`])
  })
  it('moves to -2, -3 when taken', async () => {
    const {attempts, create} = fakeCreate([`blog.${HOST}`, `blog-2.${HOST}`])
    const result = await createWithFreeDomain({name: 'blog', host: HOST, domain: `blog.${HOST}`, create})
    expect(result.domain).to.equal(`blog-3.${HOST}`)
    expect(attempts).to.deep.equal([`blog.${HOST}`, `blog-2.${HOST}`, `blog-3.${HOST}`])
  })
  it('gives up after -5 with the reason', async () => {
    const all = domainCandidates('blog', HOST)
    const {attempts, create} = fakeCreate(all)
    const reason = await reasonOf(createWithFreeDomain({name: 'blog', host: HOST, domain: `blog.${HOST}`, create}))
    expect(reason).to.equal(`all of blog.${HOST} .. blog-5.${HOST} are taken`)
    expect(attempts).to.deep.equal(all)
  })
  it('re-truncates a 63 character label when adding a suffix', async () => {
    const label = 'e'.repeat(63)
    const {create} = fakeCreate([`${label}.${HOST}`])
    const result = await createWithFreeDomain({name: 'blog', host: HOST, domain: `${label}.${HOST}`, create})
    expect(result.domain).to.equal(`${'e'.repeat(61)}-2.${HOST}`)
  })
  it('does not retry when create throws (timeouts, auth, anything)', async () => {
    let attempts = 0
    const create = async () => {
      attempts++
      throw new Error('HTTP error: 500 boom')
    }

    try {
      await createWithFreeDomain({name: 'blog', host: HOST, domain: `blog.${HOST}`, create})
    } catch (error) {
      expect((error as Error).message).to.equal('HTTP error: 500 boom')
      expect(attempts).to.equal(1)
      return
    }

    throw new Error('expected the error to propagate')
  })
})

const taken = (msg: string) => JSON.stringify({detail: [{type: 'value_error', loc: ['body', 'domain'], msg, input: 'x'}]})

describe('isDomainTaken', () => {
  it('recognises the daemon answers for a taken domain', () => {
    expect(isDomainTaken(taken('Value error, Domain already taken by a project'))).to.be.true
    expect(isDomainTaken(taken('Value error, Domain already taken by Disco'))).to.be.true
  })
  it('does not treat other 422s as taken', () => {
    expect(isDomainTaken(JSON.stringify({detail: [{loc: ['body', 'name'], msg: 'String should match pattern'}]}))).to.be
      .false
    expect(isDomainTaken(JSON.stringify({detail: [{loc: ['body', 'domain'], msg: 'String should match pattern'}]}))).to
      .be.false
    expect(isDomainTaken('not json')).to.be.false
    expect(isDomainTaken('{}')).to.be.false
    expect(isDomainTaken('')).to.be.false
  })
})
