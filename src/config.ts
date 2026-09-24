import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import {ux} from '@oclif/core'

// DISCO_CONFIG_PATH overrides the default ~/.disco/config.json (tests, ci, several configs)
const configPath = () => process.env.DISCO_CONFIG_PATH || `${os.homedir()}/.disco/config.json`
export const configFolder = () => path.dirname(configPath())

export interface DiscoConfig {
  apiKey: string
  host: string
  name: string
}

interface HostDiscoConfig {
  [name: string]: DiscoConfig
}

export function isDiscoAlreadyInConfig(name: string): boolean {
  const config = getConfig()
  return Object.keys(config.discos).includes(name)
}

export function addDisco({name, host, apiKey}: {name: string; host: string; apiKey: string}): void {
  const config = getConfig()
  if (name in config.discos) {
    throw new Error(`Disco ${name} already in config`)
  }

  config.discos[name] = {
    apiKey,
    host,
    name,
  }

  saveConfig(config)
}

export function discoAlreadyInConfig(name: string): boolean {
  const config = getConfig()
  return Object.keys(config.discos).includes(name)
}

export function getDisco(name: null | string): DiscoConfig {
  const config = getConfig()

  const availableDiscosOutput = Object.keys(config.discos)
    .sort()
    .map((d) => ux.colorize('green', `- ${d}`))
    .join('\n')

  if (name === null) {
    const discos = Object.keys(config.discos)
    if (discos.length !== 1) {
      throw new Error(`Please specify the --disco option.\n\nAvailable discos:\n${availableDiscosOutput}`)
    }

    name = discos[0]
  } else if (!(name in config.discos)) {
    throw new Error(`disco "${name}" not in config.\n\nAvailable discos:\n${availableDiscosOutput}`)
  }

  return config.discos[name]
}

export function getApiKey(disco: null | string = null): string {
  const discoConfig = getDisco(disco)
  return discoConfig.apiKey
}

// the entry keeps its name, unless it was named after the old host: then it
// follows the host, so `--disco <host>` keeps working
export function setHost(name: string, host: string): DiscoConfig {
  const config = getConfig()
  const disco = config.discos[name]
  if (disco === undefined) {
    throw new Error(`disco "${name}" not in config`)
  }

  const namedAfterHost = name === disco.host
  disco.host = host
  if (namedAfterHost && name !== host) {
    delete config.discos[name]
    disco.name = host
    config.discos[host] = disco
    name = host
  }

  saveConfig(config)
  return getDisco(name)
}

export function getConfig(): {discos: HostDiscoConfig} {
  if (!fs.existsSync(configPath())) {
    return {discos: {}}
  }

  const configData = fs.readFileSync(configPath(), 'utf8')
  try {
    return JSON.parse(configData)
  } catch (error) {
    throw new Error(`An error happened when trying to read the ~/.disco/config.json file -- ${error}`)
  }
}

export function saveConfig(config: {discos: HostDiscoConfig}): void {
  if (!fs.existsSync(configFolder())) {
    fs.mkdirSync(configFolder(), {recursive: true})
  }

  const configData = JSON.stringify(config, null, 4)
  fs.writeFileSync(configPath(), configData, 'utf8')
}
