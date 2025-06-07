import WebSocket from 'ws';
import {Args, Command, Flags} from '@oclif/core'

import {getDisco} from '../config.js'
import {request, readEventSource} from '../auth-request.js'

export default class Run extends Command {
  static override args = {
    command: Args.string({description: 'command to run'}),
  }

  static override description = 'remotely run a command'

  static override examples = ['<%= config.bin %> <%= command.id %> --project mysite "python migrate.py"']

  static override flags = {
    project: Flags.string({required: true}),
    service: Flags.string({required: false}),
    timeout: Flags.integer({required: false, default: 600}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Run)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/${flags.project}/runs`
    const body = {
      command: args.command,
      service: flags.service ?? null,
      timeout: flags.timeout,
    }
    const res = await request({method: 'POST', url, discoConfig, body, expectedStatuses: [202]})
    const respBody = (await res.json()) as {run: {
      id: string,
      number: number,
    }};
    const wsUrl = `wss://${discoConfig.host}/api/projects/${flags.project}/runs/${respBody.run.id}/ws`;
    const ws = new WebSocket(wsUrl);
    ws.on('error', console.error);
    ws.on('message', (data) => {
      if (data instanceof Buffer && data.length >= 2) {
        const prefix = data.subarray(0, 2).toString('utf8');
        const restOfMessage = data.subarray(2);
        if (prefix === 'o:') {
          process.stdout.write(restOfMessage);
        } else if (prefix === 'e:') {
          process.stderr.write(restOfMessage);
        } else if (prefix === 's:') {
          const statusCode = Number.parseInt(restOfMessage.toString('utf8'), 10);
          this.exit(statusCode);
        }
      }
    });
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on( 'data', (key) => {      
      ws.send(key, {binary: true});
    });
  }
}
