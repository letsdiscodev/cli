import {Command, Flags} from '@oclif/core'
import chalk from 'chalk'

import {request} from '../../auth-request.js'
import {getDisco} from '../../config.js'

type DaemonNode = {
  discoName: string
  state: string
  availability: string
  role: string
  address: string
  isManager: boolean
}

type Member = {
  id: string
  address: string
  role: string
  discoName: string
  reachable: boolean
  isLocalDaemonNode: boolean
}

type SwarmNode = {
  discoName: string
  state: string
  availability: string
  role: string
  address: string
}

type StatusResponse = {
  daemonNode: DaemonNode
  cluster: {
    isLocked: boolean
    lastProbeError: string | null
    voters: {alive: number; needed: number; total: number}
    members: Member[] | null
  }
  swarmNodes: SwarmNode[]
  recoveryGuidance: {
    needed: boolean
    recommendation: {keepNode: string; removeNodes: string[]} | null
  }
}

export default class DqliteStatus extends Command {
  static description = "show dqlite cluster health, including whether recovery is needed"

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DqliteStatus)
    const discoConfig = getDisco(flags.disco || null)

    const url = `https://${discoConfig.host}/api/disco/swarm/dqlite/status`
    const res = await request({method: 'GET', url, discoConfig})
    const body = (await res.json()) as StatusResponse

    // Daemon node
    this.log(chalk.bold('Daemon node'))
    this.log(`  ${body.daemonNode.discoName} (${body.daemonNode.address}) — ${body.daemonNode.role}, ${body.daemonNode.state}`)
    this.log('')

    // Cluster
    const lockedLabel = body.cluster.isLocked
      ? chalk.red('LOCKED')
      : chalk.green('healthy')
    this.log(chalk.bold('Cluster'))
    this.log(`  Status: ${lockedLabel}`)
    if (body.cluster.lastProbeError) {
      this.log(`  Last probe: ${body.cluster.lastProbeError}`)
    }

    const v = body.cluster.voters
    this.log(`  Voters: ${v.alive} alive / ${v.needed} needed for quorum / ${v.total} total`)

    if (body.cluster.members) {
      this.log('  Members:')
      for (const m of body.cluster.members) {
        const local = m.isLocalDaemonNode ? ' (this node)' : ''
        const reach = m.reachable ? chalk.green('reachable') : chalk.red('unreachable')
        this.log(`    - ${m.discoName || m.address} [${m.role}] ${reach}${local}`)
      }
    } else {
      this.log('  Members: (could not query — local dqlite is unreachable)')
    }
    this.log('')

    // Swarm nodes
    this.log(chalk.bold('Swarm nodes'))
    for (const sn of body.swarmNodes) {
      const state = sn.state === 'ready'
        ? chalk.green(sn.state)
        : chalk.red(sn.state)
      this.log(`  ${sn.discoName} (${sn.address}) — ${sn.role}, ${state}, ${sn.availability}`)
    }
    this.log('')

    // Recovery guidance
    if (body.recoveryGuidance.needed) {
      this.log(chalk.bold(chalk.yellow('Recovery needed.')))
      const rec = body.recoveryGuidance.recommendation
      if (rec) {
        this.log(`  Recommended:`)
        this.log(`    Keep node:    ${rec.keepNode}`)
        if (rec.removeNodes.length > 0) {
          this.log(`    Remove nodes: ${rec.removeNodes.join(', ')}`)
        } else {
          this.log(`    Remove nodes: (none — all other nodes will be wiped & rejoined)`)
        }
      }
      this.log(`  Run: ${chalk.cyan(`disco dqlite recover`)}`)
    } else {
      this.log(chalk.green('Cluster is healthy. No recovery needed.'))
    }
  }
}
