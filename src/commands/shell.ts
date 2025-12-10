import { Command, Flags } from '@oclif/core'

import { getDisco } from '../config.js'
import { checkShellSupport, runInteractiveShell } from '../shell-client.js'

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
    const { supported, version } = await checkShellSupport(discoConfig)

    if (!supported) {
      this.error(
        `Interactive shell is not available for this version of Disco (${version}). Please upgrade using \`disco meta:upgrade\``,
      )
    }

    try {
      await runInteractiveShell({
        project: flags.project,
        discoConfig,
        service: flags.service,
        interactive: true,
      })
    } catch (error) {
      this.error((error as Error).message)
    }
  }
}
