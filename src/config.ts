import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const HOME_DIR = os.homedir()
const CONFIG_PATH = `${HOME_DIR}/.disco/config.json`
const CONFIG_FOLDER = `${HOME_DIR}/.disco`
const CERTS_FOLDER = `${HOME_DIR}/.disco/certs`

export interface DiscoConfig {
  apiKey: string
  host: string
  ip: string
  name: string
}

interface HostDiscoConfig {
  [name: string]: DiscoConfig
}

export function isDiscoAlreadyInConfig(name: string): boolean {
  const config = getConfig()
  return Object.keys(config.discos).includes(name)
}

export function addDisco(
  name: string,
  host: string,
  ip: string,
  apiKey: string,
  publicKey: null | string = null,
): void {
  const config = getConfig()
  if (name in config.discos) {
    throw new Error(`Disco ${name} already in config`)
  }

  config.discos[name] = {
    apiKey,
    host,
    ip,
    name,
  }

  saveConfig(config)

  if (publicKey !== null) {
    writeCert(ip, publicKey)
  }
}

export function discoAlreadyInConfig(name: string): boolean {
  const config = getConfig()
  return Object.keys(config.discos).includes(name)
}

export function getDisco(name: null | string): DiscoConfig {
  const config = getConfig()
  if (name === null) {
    const discos = Object.keys(config.discos)
    if (discos.length !== 1) {
      throw new Error('Please specify --disco')
    }

    name = discos[0]
  }

  return config.discos[name]
}

export function getApiKey(disco: null | string = null): string {
  const discoConfig = getDisco(disco)
  return discoConfig.apiKey
}

export function setHost(name: string, host: string): DiscoConfig {
  const config = getConfig()
  if (name === config.discos[name].host) {
    config.discos[host] = config.discos[name]
    config.discos[host].name = host
    delete config.discos[name]
    name = host
    config.discos[name].host = host
  }

  saveConfig(config)
  return getDisco(name)
}

export function getConfig(): {discos: HostDiscoConfig} {
  if (!fs.existsSync(CONFIG_PATH)) {
    return {discos: {}}
  }

  const configData = fs.readFileSync(CONFIG_PATH, 'utf8')
  try {
    return JSON.parse(configData)
  } catch (error) {
    throw new Error(`An error happened when trying to read the ~/.disco/config.json file -- ${error}`)
  }
}

export function saveConfig(config: {discos: HostDiscoConfig}): void {
  if (!fs.existsSync(CONFIG_FOLDER)) {
    fs.mkdirSync(CONFIG_FOLDER, {recursive: true})
  }

  const configData = JSON.stringify(config, null, 4)
  fs.writeFileSync(CONFIG_PATH, configData, 'utf8')
}

export function certPath(ip: string): string {
  return path.join(CERTS_FOLDER, `${ip}.crt`)
}

export function writeCert(ip: string, publicKey: string): void {
  if (!fs.existsSync(CONFIG_FOLDER)) {
    fs.mkdirSync(CONFIG_FOLDER, {recursive: true})
  }

  if (!fs.existsSync(CERTS_FOLDER)) {
    fs.mkdirSync(CERTS_FOLDER, {recursive: true})
  }

  fs.writeFileSync(certPath(ip), publicKey, 'utf8')
}
