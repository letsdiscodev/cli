import {Command, Flags} from '@oclif/core'
import {getDisco} from '../../config.js'
import {request, readEventSource} from '../../auth-request.js'
import {compare} from 'compare-versions'
import cliui from 'cliui'

export default class MetaStats extends Command {
  static description = 'fetch stats about the server'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(MetaStats)
    const discoConfig = getDisco(flags.disco || null)

    // first get the meta version and semver compare it to 0.19.0
    let url = `https://${discoConfig.host}/api/disco/meta`
    const res = await request({method: 'GET', url, discoConfig})
    const data = (await res.json()) as any
    if (compare(data.version, '0.19.0', '<')) {
      // this error will also exit.
      this.error('Stats are not available for this version of Disco, please upgrade using `disco meta:upgrade`')
    }

    url = `https://${discoConfig.host}/api/disco/stats-experimental`

    this.log('Gathering stats...')

    readEventSource(url, discoConfig, {
      onMessage: (event: MessageEvent) => {
        this.formatAndPrintStats(JSON.parse(event.data))
      },
    })
  }

  private formatAndPrintStats(responseBody: any) {
    // Process each container's stats
    const out = responseBody.stats.map((stat: any) => {
      // Calculate CPU percentage
      const cpuDelta = stat.cpu_stats.cpu_usage.total_usage - stat.precpu_stats.cpu_usage.total_usage
      const systemDelta = stat.cpu_stats.system_cpu_usage - stat.precpu_stats.system_cpu_usage
      const cpuPercent = (cpuDelta / systemDelta) * stat.cpu_stats.online_cpus * 100

      // Get memory usage in MB
      const memoryMB = (stat.memory_stats.usage / (1024 * 1024)).toFixed(1)
      const memoryPercent = ((stat.memory_stats.usage / stat.memory_stats.limit) * 100).toFixed(1)

      // Extract container name (removing path-like prefixes)
      const name = stat.name.match(/^\/([^.]+)/)[1]
      return {
        name,
        cpuPercent,
        memoryMB,
        memoryPercent,
      }
    })

    // sort by name
    out.sort((a: any, b: any) => a.name.localeCompare(b.name))

    const ui = (cliui as any)({})

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
