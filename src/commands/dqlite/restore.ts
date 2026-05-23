import {Command, Flags} from '@oclif/core'
import chalk from 'chalk'

import {request} from '../../auth-request.js'
import {getDisco} from '../../config.js'

type StatusResponse = {
  daemonNode: {discoName: string}
}

export default class DqliteRestore extends Command {
  static description = 'show the SSH command for restoring dqlite from a backup'

  static examples = [
    '<%= config.bin %> <%= command.id %> --backup pre-update-2026-05-23T08-12-00Z.db',
  ]

  static flags = {
    disco: Flags.string({required: false}),
    backup: Flags.string({
      required: true,
      description: 'backup filename (e.g. pre-update-2026-05-23T08-12-00Z.db)',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DqliteRestore)
    const discoConfig = getDisco(flags.disco || null)

    // Try to resolve the keep node from the daemon. If the daemon is
    // unreachable, fall through with a placeholder — the operator can
    // still see the shape of the command.
    let keepNode = '<keep-node-name>'
    try {
      const statusUrl = `https://${discoConfig.host}/api/disco/swarm/dqlite/status`
      const res = await request({method: 'GET', url: statusUrl, discoConfig})
      const status = (await res.json()) as StatusResponse
      keepNode = status.daemonNode.discoName
    } catch {
      // ignore — operator gets a placeholder
    }

    this.log('')
    this.log(chalk.bold('Restore is an SSH-gated operation.'))
    this.log('Restore replaces the keep-node\'s current dqlite data with the contents of')
    this.log('the named backup file. Because it is destructive and is the kind of thing')
    this.log('you want to do consciously, it is not exposed as an HTTP endpoint.')
    this.log('')
    this.log(`SSH into a manager host (preferably ${keepNode}) and run:`)
    this.log('')
    this.log(chalk.cyan(`  sudo docker run --rm -it \\`))
    this.log(chalk.cyan(`      -v /var/run/docker.sock:/var/run/docker.sock \\`))
    this.log(chalk.cyan(`      -v "$HOME/disco/backups:/disco/backups" \\`))
    this.log(chalk.cyan(`      --network disco-dqlite \\`))
    this.log(chalk.cyan(`      letsdiscodev/daemon:<version> \\`))
    this.log(chalk.cyan(`      disco_restore \\`))
    this.log(chalk.cyan(`          --backup ${flags.backup} \\`))
    this.log(chalk.cyan(`          --keep-node ${keepNode}`))
    this.log('')
    this.log('Add --remove-nodes <comma-separated-names> to force-remove dead nodes from')
    this.log('the Swarm during restore. Survivors not listed are wiped & rejoined.')
    this.log('')
    this.log(chalk.yellow('You must be root on the host (or in the docker group) to run this.'))
  }
}
