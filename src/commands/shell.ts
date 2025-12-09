import { Command, Flags } from '@oclif/core'
import { compare } from 'compare-versions'
import WS from 'ws'

import { request } from '../auth-request.js'
import { getDisco } from '../config.js'

function restoreTerminal(): void {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false)
  }

  process.stdin.pause()
}

export default class Shell extends Command {

  static override description = 'open an interactive shell session in a project container'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --project mysite',
    '<%= config.bin %> <%= command.id %> --project mysite --service worker',
  ]

  static override flags = {
    project: Flags.string({ required: true, description: 'project name' }),
    service: Flags.string({ required: false, description: 'service name (defaults to web or first non-static service)' }),
    disco: Flags.string({ required: false, description: 'disco to use' }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Shell)

    const discoConfig = getDisco(flags.disco || null)

    // Check daemon version supports shell
    const metaUrl = `https://${discoConfig.host}/api/disco/meta`
    const res = await request({ method: 'GET', url: metaUrl, discoConfig })
    const meta = (await res.json()) as { version: string }

    if (compare(meta.version, '0.28.0', '<')) {
      this.error(
        'Interactive shell is not available for this version of Disco. Please upgrade using `disco meta:upgrade`',
      )
    }

    // Connect directly to WebSocket endpoint
    const wsUrl = `wss://${discoConfig.host}/api/projects/${flags.project}/shell`

    const ws = new WS(wsUrl)

    ws.on('open', () => {
      // Send API key and optional service as first message for authentication
      const authMessage: { token: string; service?: string } = { token: discoConfig.apiKey }
      if (flags.service) {
        authMessage.service = flags.service
      }

      ws.send(JSON.stringify(authMessage))
    })

    ws.on('message', (data: WS.RawData, isBinary: boolean) => {
      if (isBinary) {
        // Binary data = terminal output
        process.stdout.write(data as Buffer)
      } else {
        // Text data = JSON control message
        try {
          const message = JSON.parse(data.toString())
          if (message.type === 'connected') {
            // Successfully authenticated, set up terminal
            if (process.stdin.isTTY) {
              process.stdin.setRawMode(true)
            }

            process.stdin.resume()

            // Send initial terminal size
            if (process.stdout.isTTY) {
              ws.send(JSON.stringify({
                type: 'resize',
                cols: process.stdout.columns,
                rows: process.stdout.rows,
              }))
            }

            // Handle terminal resize
            process.stdout.on('resize', () => {
              if (process.stdout.isTTY && ws.readyState === WS.OPEN) {
                ws.send(JSON.stringify({
                  type: 'resize',
                  cols: process.stdout.columns,
                  rows: process.stdout.rows,
                }))
              }
            })

            // Forward stdin to WebSocket as binary
            process.stdin.on('data', (chunk: Buffer) => {
              if (ws.readyState === WS.OPEN) {
                ws.send(chunk)
              }
            })
          }
        } catch {
          // Not JSON, treat as text output
          process.stdout.write(data.toString())
        }
      }
    })

    ws.on('close', (code, reason) => {
      restoreTerminal()

      if (code !== 1000) {
        this.error(`Connection closed: ${code} ${reason.toString()}`)
      }
    })

    ws.on('error', (err) => {
      restoreTerminal()
      this.error(`WebSocket error: ${err.message}`)
    })

    // Keep the process running until WebSocket closes
    await new Promise<void>((resolve) => {
      ws.on('close', () => resolve())
    })
  }
}
