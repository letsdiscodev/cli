import WebSocket from 'ws';
import {Args, Command, Flags} from '@oclif/core'

import {getDisco} from '../config.js'
import {request, readEventSource} from '../auth-request.js'


export default class Interactive extends Command {
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
    const ws = new WebSocket('wss://app1.antoineleclair.ca/api/projects/flask/runs-ws');
    ws.on('error', console.error);
    ws.on('message', (data) => {
      if (data instanceof Buffer && data.length >= 2) {
        const prefix = data.subarray(0, 2).toString('utf8');
        const restOfMessage = data.subarray(2);
        if (prefix === 'o:') {
          process.stdout.write(restOfMessage);
        } else if (prefix === 'e:') {
          process.stderr.write(restOfMessage);
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





