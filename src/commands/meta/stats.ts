import {createRequire} from 'node:module'

import {Command, Flags} from '@oclif/core'
import {compare} from 'compare-versions'

import {request, readEventSource} from '../../auth-request.js'
import {getDisco} from '../../config.js'
import {MetaResponse} from './info.js'

const require = createRequire(import.meta.url)
const cliui = require('cliui')

interface ContainerStat {
  name: string
  cpu_stats: {
    cpu_usage: { total_usage: number }
    system_cpu_usage: number
    online_cpus: number
  }
  precpu_stats: {
    cpu_usage: { total_usage: number }
    system_cpu_usage: number
  }
  memory_stats: {
    usage: number
    limit: number
  }
}

interface StatsResponse {
  stats: ContainerStat[]
  df?: {
    used: number
    available: number
  }
}

interface FormattedStat {
  name: string
  cpuPercent: number
  memoryMB: string
  memoryPercent: string
}

export default class MetaStats extends Command {
  static description = 'fetch stats about the server'

  static enableJsonFlag = true

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<StatsResponse | void> {
    const {flags} = await this.parse(MetaStats)
    const discoConfig = getDisco(flags.disco || null)

    // first get the meta version and semver compare it to 0.19.0
    let url = `https://${discoConfig.host}/api/disco/meta`
    const res = await request({method: 'GET', url, discoConfig})
    const data = (await res.json()) as MetaResponse
    if (compare(data.version, '0.19.0', '<')) {
      // this error will also exit.
      this.error('Stats are not available for this version of Disco, please upgrade using `disco meta:upgrade`')
    }

    url = `https://${discoConfig.host}/api/disco/stats-experimental`

    // If --json flag is used, fetch once and return
    if (flags.json) {
      return new Promise((resolve) => {
        const { eventSource } = readEventSource(url, discoConfig, {
          onMessage: (event: MessageEvent) => {
            const statsData = JSON.parse(event.data) as StatsResponse
            eventSource.close()
            resolve(statsData)
          },
        })
      })
    }

    this.log('Gathering stats...')

    readEventSource(url, discoConfig, {
      onMessage: (event: MessageEvent) => {
        this.formatAndPrintStats(JSON.parse(event.data))
      },
    })
  }

  private formatAndPrintStats(responseBody: StatsResponse) {
    // Process each container's stats
    const out: FormattedStat[] = responseBody.stats.map((stat) => {
      // Calculate CPU percentage
      const cpuDelta = stat.cpu_stats.cpu_usage.total_usage - stat.precpu_stats.cpu_usage.total_usage
      const systemDelta = stat.cpu_stats.system_cpu_usage - stat.precpu_stats.system_cpu_usage
      const cpuPercent = (cpuDelta / systemDelta) * stat.cpu_stats.online_cpus * 100

      // Get memory usage in MB
      const memoryMB = (stat.memory_stats.usage / (1024 * 1024)).toFixed(1)
      const memoryPercent = ((stat.memory_stats.usage / stat.memory_stats.limit) * 100).toFixed(1)

      // Extract container name (removing path-like prefixes)
      const match = stat.name.match(/^\/([^.]+)/)
      const name = match ? match[1] : stat.name
      return {
        name,
        cpuPercent,
        memoryMB,
        memoryPercent,
      }
    })

    // sort by name
    out.sort((a, b) => a.name.localeCompare(b.name))

    const ui = cliui({})

    ui.div(
      {
        text: 'Container',
      },
      {
        text: 'CPU %',
      },
      {
        text: 'Memory',
      },
      {
        text: 'Memory %',
      },
    )
    for (const o of out) {
      ui.div(
        {
          text: o.name,
        },
        {
          text: o.cpuPercent.toFixed(1),
        },
        {
          text: `${o.memoryMB}MB`,
        },
        {
          text: `${o.memoryPercent}%`,
        },
      )
    }

    // clear console
    process.stdout.write('\u001Bc')
    this.log(ui.toString())
    this.log('')
    if (responseBody.df) {
      // was added in daemon 0.25.3
      const used = Math.round(responseBody.df.used/1024/1024 * 10) / 10;
      const available = Math.round(responseBody.df.available/1024/1024 * 10) / 10;
      this.log(`Disk usage: ${used}GB used, ${available}GB available.`)
      this.log('')
    }

    this.log('Press Ctrl+C to exit')
  }
}
