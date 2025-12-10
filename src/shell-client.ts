import { compare } from 'compare-versions'
import WS from 'ws'

import { request } from './auth-request.js'
import { DiscoConfig } from './config.js'

export interface ShellOptions {
  project: string
  discoConfig: DiscoConfig
  service?: string
  command?: string
  interactive?: boolean
}

export interface ShellResult {
  exitCode: number
  output: string
}

export async function checkShellSupport(discoConfig: DiscoConfig): Promise<{ supported: boolean; version: string }> {
  const metaUrl = `https://${discoConfig.host}/api/disco/meta`
  const res = await request({ method: 'GET', url: metaUrl, discoConfig })
  const meta = (await res.json()) as { version: string }
  return {
    supported: compare(meta.version, '0.28.0', '>='),
    version: meta.version,
  }
}

export function runCommandViaShell(options: ShellOptions): Promise<ShellResult> {
  const { project, discoConfig, service, command } = options

  return new Promise((resolve, reject) => {
    const wsUrl = `wss://${discoConfig.host}/api/projects/${project}/shell`
    const ws = new WS(wsUrl)
    let output = ''
    let exitCode = 0

    ws.on('open', () => {
      const authMessage: { token: string; service?: string; command?: string } = { token: discoConfig.apiKey }

      if (service) {
        authMessage.service = service
      }

      if (command) {
        authMessage.command = command
      }

      ws.send(JSON.stringify(authMessage))
    })

    ws.on('message', (data: WS.RawData, isBinary: boolean) => {
      if (isBinary) {
        const chunk = (data as Buffer).toString()
        output += chunk
        process.stdout.write(chunk)
      } else {
        try {
          const message = JSON.parse(data.toString())
          if (message.type === 'connected') {
            // Successfully authenticated - command mode doesn't need raw terminal
          } else if (message.type === 'ping' && ws.readyState === WS.OPEN) {
            ws.send(JSON.stringify({ type: 'pong' }))
          } else if (message.type === 'exit') {
            exitCode = message.code ?? 0
          }
        } catch {
          // Not JSON, treat as text output
          const text = data.toString()
          output += text
          process.stdout.write(text)
        }
      }
    })

    ws.on('close', (code, reason) => {
      if (code === 1000) {
        resolve({ exitCode, output })
      } else {
        reject(new Error(`Connection closed: ${code} ${reason.toString()}`))
      }
    })

    ws.on('error', (err) => {
      reject(new Error(`WebSocket error: ${err.message}`))
    })
  })
}

function restoreTerminal(): void {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false)
  }

  process.stdin.pause()
}

export function runInteractiveShell(options: ShellOptions): Promise<void> {
  const { project, discoConfig, service } = options

  return new Promise((resolve, reject) => {
    const wsUrl = `wss://${discoConfig.host}/api/projects/${project}/shell`
    const ws = new WS(wsUrl)

    ws.on('open', () => {
      const authMessage: { token: string; service?: string } = { token: discoConfig.apiKey }

      if (service) {
        authMessage.service = service
      }

      ws.send(JSON.stringify(authMessage))
    })

    ws.on('message', (data: WS.RawData, isBinary: boolean) => {
      if (isBinary) {
        process.stdout.write(data as Buffer)
      } else {
        try {
          const message = JSON.parse(data.toString())
          if (message.type === 'connected') {
            if (process.stdin.isTTY) {
              process.stdin.setRawMode(true)
            }

            process.stdin.resume()

            if (process.stdout.isTTY) {
              ws.send(JSON.stringify({
                type: 'resize',
                cols: process.stdout.columns,
                rows: process.stdout.rows,
              }))
            }

            process.stdout.on('resize', () => {
              if (process.stdout.isTTY && ws.readyState === WS.OPEN) {
                ws.send(JSON.stringify({
                  type: 'resize',
                  cols: process.stdout.columns,
                  rows: process.stdout.rows,
                }))
              }
            })

            process.stdin.on('data', (chunk: Buffer) => {
              if (ws.readyState === WS.OPEN) {
                ws.send(chunk)
              }
            })
          } else if (message.type === 'ping' && ws.readyState === WS.OPEN) {
            ws.send(JSON.stringify({ type: 'pong' }))
          }
        } catch {
          process.stdout.write(data.toString())
        }
      }
    })

    ws.on('close', (code, reason) => {
      restoreTerminal()

      if (code === 1000) {
        resolve()
      } else {
        reject(new Error(`Connection closed: ${code} ${reason.toString()}`))
      }
    })

    ws.on('error', (err) => {
      restoreTerminal()
      reject(new Error(`WebSocket error: ${err.message}`))
    })
  })
}
