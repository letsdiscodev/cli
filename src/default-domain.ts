import {Resolver} from 'node:dns/promises'

// the default project domain is <label>.<host>, where host is the disco server's own
// hostname. the backend creates a wildcard record for every disco-provided host, so the
// name resolves to the server without any per-project dns work. we only use it when
// public dns agrees: <label>.<host> must resolve to exactly the same addresses as <host>.

export const MAX_LABEL_LENGTH = 63
export const MAX_DOMAIN_LENGTH = 253
export const MAX_SUFFIX = 5
const QUERY_TIMEOUT_MS = 3000
const TOTAL_TIMEOUT_MS = 6000
const PUBLIC_RESOLVERS = ['1.1.1.1', '8.8.8.8']
// these two mean "no such record", which is an answer, not a failure
const EMPTY_ANSWER_CODES = new Set(['ENOTFOUND', 'ENODATA'])

export interface Addresses {
  a: string[]
  aaaa: string[]
}

export type Resolve = (name: string) => Promise<Addresses>

export class DefaultDomainError extends Error {
  constructor(
    public readonly projectName: string,
    public readonly reason: string,
  ) {
    super(
      `Could not pick a domain for ${projectName}: ${reason}.\n` +
        'Pass --domain <your.domain>, or --no-domain for a project without a URL.',
    )
    this.name = 'DefaultDomainError'
  }
}

// the project name made hostname-safe. the daemon accepts names like "foo-" or "a--b",
// a dns label does not.
export function hostnameLabel(name: string): string {
  const cleaned = name.toLowerCase().replaceAll(/-+/g, '-').replaceAll(/^-+|-+$/g, '')
  return truncateLabel(cleaned)
}

function truncateLabel(label: string): string {
  return label.slice(0, MAX_LABEL_LENGTH).replaceAll(/-+$/g, '')
}

// <label>.<host>, <label>-2.<host> .. <label>-5.<host>, each label kept within 63 chars
export function domainCandidates(label: string, host: string): string[] {
  const candidates = [`${label}.${host}`]
  for (let i = 2; i <= MAX_SUFFIX; i++) {
    const suffix = `-${i}`
    const base = truncateLabel(label.slice(0, MAX_LABEL_LENGTH - suffix.length))
    candidates.push(`${base}${suffix}.${host}`)
  }

  return candidates
}

function normalizeSet(addresses: string[]): string[] {
  return [...new Set(addresses.map((a) => a.trim().toLowerCase()))].sort()
}

export function sameSet(x: string[], y: string[]): boolean {
  const a = normalizeSet(x)
  const b = normalizeSet(y)
  return a.length === b.length && a.every((v, i) => v === b[i])
}

// picks <label>.<host> and checks, with public dns, that it resolves exactly like the
// host does. throws DefaultDomainError with the reason otherwise.
export async function chooseDefaultDomain({
  name,
  host,
  resolve,
}: {
  name: string
  host: string
  resolve: Resolve
}): Promise<string> {
  const label = hostnameLabel(name)
  if (label === '') {
    throw new DefaultDomainError(name, 'the project name leaves nothing usable as a hostname label')
  }

  const candidate = `${label}.${host}`
  if (candidate.length > MAX_DOMAIN_LENGTH) {
    throw new DefaultDomainError(name, `${candidate} is longer than ${MAX_DOMAIN_LENGTH} characters`)
  }

  let hostAddresses: Addresses
  let candidateAddresses: Addresses
  try {
    ;[hostAddresses, candidateAddresses] = await Promise.all([resolve(host), resolve(candidate)])
  } catch (error) {
    throw new DefaultDomainError(name, `DNS lookup failed (${errorCode(error)})`)
  }

  if (hostAddresses.a.length === 0 && hostAddresses.aaaa.length === 0) {
    throw new DefaultDomainError(name, `${host} does not resolve`)
  }

  if (candidateAddresses.a.length === 0 && candidateAddresses.aaaa.length === 0) {
    throw new DefaultDomainError(name, `${host} has no wildcard DNS for ${candidate}`)
  }

  if (!sameSet(hostAddresses.a, candidateAddresses.a) || !sameSet(hostAddresses.aaaa, candidateAddresses.aaaa)) {
    throw new DefaultDomainError(name, `${candidate} does not resolve to the same address as ${host}`)
  }

  return candidate
}

export type CreateResult<T> = {status: 'created'; data: T} | {status: 'domain-taken'}

// creates the project with the first free candidate. the daemon is the only source of
// truth for "taken": it answers 422 on the domain field, and we move to the next suffix.
// anything else the create function throws propagates untouched (never retry on a
// timeout: the project may exist).
export async function createWithFreeDomain<T>({
  name,
  host,
  domain,
  create,
}: {
  name: string
  host: string
  domain: string
  create: (domain: string) => Promise<CreateResult<T>>
}): Promise<{data: T; domain: string}> {
  const label = domain.slice(0, domain.length - host.length - 1)
  const candidates = domainCandidates(label, host)
  for (const candidate of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const result = await create(candidate)
    if (result.status === 'created') {
      return {data: result.data, domain: candidate}
    }
  }

  throw new DefaultDomainError(name, `all of ${candidates[0]} .. ${candidates.at(-1)} are taken`)
}

export function errorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return 'AbortError'
  }

  return 'unknown'
}

// A and AAAA from public resolvers, 3s per query, 6s total, outstanding queries cancelled
// at the deadline. a missing record type is an empty list; anything else throws with a code.
export async function resolvePublic(name: string): Promise<Addresses> {
  const resolver = new Resolver({timeout: QUERY_TIMEOUT_MS, tries: 1})
  resolver.setServers(PUBLIC_RESOLVERS)

  const emptyOnNoRecord = async (query: Promise<string[]>): Promise<string[]> => {
    try {
      return await query
    } catch (error) {
      if (EMPTY_ANSWER_CODES.has(errorCode(error))) {
        return []
      }

      throw error
    }
  }

  let timer: NodeJS.Timeout | undefined
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      resolver.cancel()
      const error = new Error(`DNS lookup of ${name} took longer than ${TOTAL_TIMEOUT_MS}ms`)
      error.name = 'AbortError'
      reject(error)
    }, TOTAL_TIMEOUT_MS)
  })

  try {
    const [a, aaaa] = await Promise.race([
      Promise.all([emptyOnNoRecord(resolver.resolve4(name)), emptyOnNoRecord(resolver.resolve6(name))]),
      deadline,
    ])
    return {a, aaaa}
  } finally {
    clearTimeout(timer)
  }
}
