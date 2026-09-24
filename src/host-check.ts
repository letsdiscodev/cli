import {isIP} from 'node:net'

import {Addresses, Resolve, errorCode, sameSet} from './default-domain.js'

// Before `meta:host` changes the address a server answers on: the new host must
// already point at the server, otherwise the dashboard, the cli and every
// certificate renewal would be talking to the wrong place. Compared with public
// dns, like the default domain of projects:add. --force skips this for tunnels
// and migrations where dns is deliberately elsewhere.

export class HostCheckError extends Error {
  constructor(reason: string) {
    super(`${reason}\nPass --force if DNS is deliberately different (a tunnel, a migration).`)
    this.name = 'HostCheckError'
  }
}

function describe(addresses: Addresses): string {
  return [...addresses.a, ...addresses.aaaa].join(', ')
}

function hasAddress(addresses: Addresses): boolean {
  return addresses.a.length > 0 || addresses.aaaa.length > 0
}

// the current host may be a bare ip (servers initialised before they had a name)
async function addressesOf(host: string, resolve: Resolve): Promise<Addresses> {
  const version = isIP(host)
  if (version === 4) {
    return {a: [host], aaaa: []}
  }

  if (version === 6) {
    return {a: [], aaaa: [host]}
  }

  return resolve(host)
}

export async function checkNewHost({
  currentHost,
  newHost,
  resolve,
}: {
  currentHost: string
  newHost: string
  resolve: Resolve
}): Promise<void> {
  let current: Addresses
  let next: Addresses
  try {
    ;[current, next] = await Promise.all([addressesOf(currentHost, resolve), addressesOf(newHost, resolve)])
  } catch (error) {
    throw new HostCheckError(`DNS lookup failed (${errorCode(error)}).`)
  }

  if (!hasAddress(current)) {
    throw new HostCheckError(`${currentHost} does not resolve, so there is no address to compare ${newHost} with.`)
  }

  if (!hasAddress(next)) {
    throw new HostCheckError(`${newHost} does not resolve. Add a DNS record pointing it at ${describe(current)} first.`)
  }

  if (!sameSet(current.a, next.a) || !sameSet(current.aaaa, next.aaaa)) {
    throw new HostCheckError(
      `${newHost} resolves to ${describe(next)} but the server (${currentHost}) is at ${describe(current)}. Point ${newHost} at the server first.`,
    )
  }
}
