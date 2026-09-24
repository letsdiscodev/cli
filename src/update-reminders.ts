import {compare, validate} from 'compare-versions'
import fetch from 'node-fetch'
import * as fs from 'node:fs'
import * as path from 'node:path'

import {configFolder, DiscoConfig, getConfig} from './config.js'

// One line after a command when something newer exists: the cli itself
// (checked once a day against the release manifest) and the daemon of the
// server the command talked to (once a week per server, against the tags on
// docker hub). Never blocks the command, never throws, silent on any error,
// off with DISCO_NO_UPDATE_CHECK.

const DAY = 24 * 60 * 60 * 1000
export const CLI_CHECK_EVERY = DAY
export const DAEMON_CHECK_EVERY = 7 * DAY
export const DAEMON_TAGS_URL = 'https://registry.hub.docker.com/v2/repositories/letsdiscodev/daemon/tags?page_size=25'
const FETCH_TIMEOUT = 2000

interface State {
  cli?: {checkedAt: number}
  daemons?: {[host: string]: {checkedAt: number}}
}

export interface UpdateCheckOptions {
  argv: string[]
  // only commands that take --disco talk to a server
  commandHasDiscoFlag: boolean
  env: NodeJS.ProcessEnv
  now: number
  cli: {bin: string; version: string; manifestUrl: null | string}
  log: (line: string) => void
}

// the network, swappable in tests
export const net = {
  async fetchJson(url: string, headers: Record<string, string> = {}): Promise<unknown> {
    const res = await fetch(url, {headers, signal: AbortSignal.timeout(FETCH_TIMEOUT)})
    if (!res.ok) {
      throw new Error(`${url}: ${res.status}`)
    }

    return res.json()
  },
}

export const stateFile = () => path.join(configFolder(), 'update-checks.json')

function readState(): State {
  try {
    return JSON.parse(fs.readFileSync(stateFile(), 'utf8')) as State
  } catch {
    return {}
  }
}

function writeState(state: State): void {
  fs.mkdirSync(configFolder(), {recursive: true})
  fs.writeFileSync(stateFile(), JSON.stringify(state, null, 2))
}

// --disco x or --disco=x in the command line, else the only disco in the config
function discoForCommand(argv: string[]): {disco: DiscoConfig; several: boolean} | null {
  const {discos} = getConfig()
  const names = Object.keys(discos)
  let name: string | undefined
  for (const [i, arg] of argv.entries()) {
    if (arg === '--disco') {
      name = argv[i + 1]
    } else if (arg.startsWith('--disco=')) {
      name = arg.slice('--disco='.length)
    }
  }

  if (name === undefined && names.length === 1) {
    name = names[0]
  }

  if (name === undefined || !(name in discos)) {
    return null
  }

  return {disco: discos[name], several: names.length > 1}
}

// the highest numbered tag, `latest` and anything that is not a version ignored
export function newestTag(tags: unknown): null | string {
  const names = (tags as {results?: {name?: unknown}[]})?.results?.map((t) => t.name) ?? []
  let newest: null | string = null
  for (const name of names) {
    if (typeof name === 'string' && validate(name) && (newest === null || compare(name, newest, '>'))) {
      newest = name
    }
  }

  return newest
}

async function cliLine(options: UpdateCheckOptions): Promise<null | string> {
  const {bin, version, manifestUrl} = options.cli
  if (manifestUrl === null || version === '0.0.0') {
    return null
  }

  const manifest = (await net.fetchJson(manifestUrl)) as {version?: unknown}
  const latest = manifest?.version
  if (typeof latest !== 'string' || !validate(latest) || !compare(latest, version, '>')) {
    return null
  }

  return `${bin} ${latest} is out (you have ${version}), run ${bin} update`
}

async function daemonLine(bin: string, disco: DiscoConfig, several: boolean): Promise<null | string> {
  const auth = 'Basic ' + Buffer.from(`${disco.apiKey}:`).toString('base64')
  const [meta, tags] = await Promise.all([
    net.fetchJson(`https://${disco.host}/api/disco/meta`, {Authorization: auth}) as Promise<{version?: unknown}>,
    net.fetchJson(DAEMON_TAGS_URL),
  ])
  const running = meta?.version
  const latest = newestTag(tags)
  if (typeof running !== 'string' || !validate(running) || latest === null || !compare(latest, running, '>')) {
    return null
  }

  const upgrade = several ? `${bin} meta:upgrade --disco ${disco.name}` : `${bin} meta:upgrade`
  return `${disco.name} runs daemon ${running}, ${latest} is out, run ${upgrade}`
}

// swallows everything: a reminder must never turn into an error
async function quietly(work: () => Promise<null | string>): Promise<null | string> {
  try {
    return await work()
  } catch {
    return null
  }
}

export async function checkForUpdates(options: UpdateCheckOptions): Promise<void> {
  if (options.env.DISCO_NO_UPDATE_CHECK) {
    return
  }

  const state = readState()
  const checks: Promise<null | string>[] = []

  const cliDue = (state.cli?.checkedAt ?? 0) + CLI_CHECK_EVERY <= options.now
  if (cliDue && options.cli.manifestUrl !== null && options.cli.version !== '0.0.0') {
    state.cli = {checkedAt: options.now}
    checks.push(quietly(() => cliLine(options)))
  }

  const target = options.commandHasDiscoFlag ? discoForCommand(options.argv) : null
  if (target !== null) {
    state.daemons ??= {}
    const {host} = target.disco
    if ((state.daemons[host]?.checkedAt ?? 0) + DAEMON_CHECK_EVERY <= options.now) {
      state.daemons[host] = {checkedAt: options.now}
      checks.push(quietly(() => daemonLine(options.cli.bin, target.disco, target.several)))
    }
  }

  if (checks.length === 0) {
    return
  }

  try {
    writeState(state)
  } catch {
    // an unwritable ~/.disco only means the check runs again next time
  }

  for (const line of await Promise.all(checks)) {
    if (line !== null) {
      options.log(line)
    }
  }
}
