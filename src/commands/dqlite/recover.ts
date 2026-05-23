import {input} from '@inquirer/prompts'
import {Command, Flags} from '@oclif/core'
import chalk from 'chalk'

import {request} from '../../auth-request.js'
import {getDisco} from '../../config.js'

const CONFIRM_TOKEN = 'RECOVER'

type StatusResponse = {
  daemonNode: {discoName: string; address: string}
  cluster: {isLocked: boolean; voters: {alive: number; needed: number; total: number}}
  swarmNodes: {discoName: string; state: string; address: string}[]
  recoveryGuidance: {
    needed: boolean
    recommendation: {keepNode: string; removeNodes: string[]} | null
  }
}

type RecoverResponse = {
  status: string
  keptNode: string
  rejoinedNodes: {name: string; status: string; error?: string}[]
  removedNodes: {name: string; status: string; error?: string}[]
  elapsedMs: number
}

export default class DqliteRecover extends Command {
  static description = 'recover dqlite cluster from quorum loss (destructive)'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --remove-nodes node-c,node-d',
  ]

  static flags = {
    disco: Flags.string({required: false}),
    'remove-nodes': Flags.string({
      required: false,
      description: 'Comma-separated disco-names to force-remove from the Swarm. Defaults to the recommended set from status.',
    }),
    yes: Flags.boolean({
      required: false,
      default: false,
      description: 'Skip the interactive RECOVER confirmation prompt.',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DqliteRecover)
    const discoConfig = getDisco(flags.disco || null)

    // Snapshot status to learn keepNode and the recommended removeNodes.
    const statusUrl = `https://${discoConfig.host}/api/disco/swarm/dqlite/status`
    const statusRes = await request({method: 'GET', url: statusUrl, discoConfig})
    const status = (await statusRes.json()) as StatusResponse

    if (!status.cluster.isLocked) {
      this.log(chalk.green('Cluster is currently healthy.'))
      this.log('Refusing to run recovery on a healthy cluster.')
      this.log(`To remove a specific node, use ${chalk.cyan('disco nodes:remove <name>')}.`)
      this.exit(1)
    }

    const rec = status.recoveryGuidance.recommendation
    if (!rec) {
      this.log(chalk.red('No recovery recommendation available from the daemon.'))
      this.exit(1)
    }

    const keepNode = rec.keepNode
    const removeNodes = flags['remove-nodes']
      ? flags['remove-nodes'].split(',').map((s) => s.trim()).filter(Boolean)
      : rec.removeNodes
    const allNames = status.swarmNodes.map((n) => n.discoName)
    const rejoinNodes = allNames.filter(
      (n) => n !== keepNode && !removeNodes.includes(n),
    )

    this.log('')
    this.log(chalk.bold('===== Recovery plan ====='))
    this.log(`  Keep node:                 ${keepNode}`)
    if (rejoinNodes.length > 0) {
      this.log(`  Wipe & rejoin (survivors): ${rejoinNodes.join(', ')}`)
    }
    if (removeNodes.length > 0) {
      this.log(`  Force-remove from Swarm:   ${removeNodes.join(', ')}`)
    }
    this.log('')
    this.log(chalk.yellow('This is destructive:'))
    this.log(`  - The cluster will be reconfigured so ${keepNode} is the only voter.`)
    if (rejoinNodes.length > 0) {
      this.log('  - The dqlite data on each survivor will be wiped before rejoining.')
    }
    if (removeNodes.length > 0) {
      this.log('  - Removed nodes are force-removed from the Swarm.')
    }
    this.log(`  - The keep-node's data is preserved (a snapshot is also saved as`)
    this.log(`    /data/<bind>.backup-<ts>/ inside its dqlite volume).`)
    this.log('')

    if (!flags.yes) {
      const typed = await input({
        message: `Type ${CONFIRM_TOKEN} to proceed:`,
      })
      if (typed.trim() !== CONFIRM_TOKEN) {
        this.log('Aborted.')
        this.exit(1)
      }
    }

    const recoverUrl = `https://${discoConfig.host}/api/disco/swarm/dqlite/recover-quorum`
    const res = await request({
      method: 'POST',
      url: recoverUrl,
      discoConfig,
      body: {keepNode, removeNodes},
    })
    const out = (await res.json()) as RecoverResponse

    this.log('')
    this.log(chalk.green('Recovery complete.'))
    this.log(`  Kept node:     ${out.keptNode}`)
    if (out.rejoinedNodes.length > 0) {
      this.log('  Rejoined survivors:')
      for (const r of out.rejoinedNodes) {
        const tag = r.status === 'rejoined'
          ? chalk.green('rejoined')
          : chalk.red(`${r.status}${r.error ? `: ${r.error}` : ''}`)
        this.log(`    - ${r.name}: ${tag}`)
      }
    }
    if (out.removedNodes.length > 0) {
      this.log('  Removed nodes:')
      for (const r of out.removedNodes) {
        const tag = r.status === 'removed'
          ? chalk.green('removed')
          : chalk.red(`${r.status}${r.error ? `: ${r.error}` : ''}`)
        this.log(`    - ${r.name}: ${tag}`)
      }
    }
    this.log(`  Took:          ${(out.elapsedMs / 1000).toFixed(1)}s`)
  }
}
