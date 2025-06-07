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
  }
}





