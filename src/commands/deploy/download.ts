import * as fs from 'node:fs'

import {Command, Flags} from '@oclif/core'
import {confirm} from '@inquirer/prompts'

import {getDisco} from '../../config.js'
import {request} from '../../auth-request.js'

export default class DeployDownload extends Command {
  static override description =
    'download the files of the latest deployment made with "deploy --dir" (queued, else in progress, else live), ' +
    'as a gzipped tar. Empty when no files were deployed yet; not available for a project with a GitHub repository'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --project=mysite --output=mysite.tar.gz',
    '<%= config.bin %> <%= command.id %> --project=mysite > mysite.tar.gz',
  ]

  static override flags = {
    project: Flags.string({required: true, description: 'project ID'}),
    disco: Flags.string({required: false, description: 'disco configuration to use'}),
    force: Flags.boolean({
      description: 'force output to terminal without confirmation',
      default: false,
    }),
    output: Flags.string({
      description: 'output file path (instead of stdout)',
      required: false,
    }),
  }

  private async confirmAction(): Promise<boolean> {
    return confirm({
      message: 'Binary data will be output to your terminal. Continue?',
      default: false,
    })
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DeployDownload)

    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/api/projects/${flags.project}/files`
    const res = await request({method: 'GET', url, discoConfig})

    const data = await res.arrayBuffer()
    const buffer = Buffer.from(data)
    const deployment = res.headers.get('x-disco-deployment')
    const status = res.headers.get('x-disco-deployment-status')
    // on stderr: stdout is the archive when not writing to a file
    const what = deployment ? `Files of deployment ${deployment} (${status})` : 'No files deployed yet, empty archive'

    if (flags.output) {
      fs.writeFileSync(flags.output, buffer)
      this.logToStderr(`${what} written to ${flags.output}`)
      return
    }

    if (process.stdout.isTTY && !flags.force) {
      this.log('Warning: You are about to output binary data to your terminal.')
      this.log('This may cause unexpected behavior or corrupt your terminal session.')
      this.log('Consider using redirection (> files.tar.gz) or the --output flag instead.')

      const confirmed = await this.confirmAction()
      if (!confirmed) {
        this.log('Export cancelled.')
        return
      }
    }

    this.logToStderr(what)
    process.stdout.write(buffer)
  }
}
