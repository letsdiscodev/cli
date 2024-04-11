import {Command, Flags} from '@oclif/core'
import * as fs from 'node:fs'

import {getDisco} from '../config'
import {request, readEventSource} from '../auth-request'

interface DeployRequest {
  commit?: string
  discoFile?: string
}

export default class Deploy extends Command {
  static override description = 'deploy a project, a specific commit or a disco.json file'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --project mysite',
    '<%= config.bin %> <%= command.id %> --project mysite --commit 7b5c8f935328c1af49c9037cac9dee7bf0bd8c7e',
  ]

  static override flags = {
    project: Flags.string({required: true}),
    commit: Flags.string({required: false}),
    // TODO file seems to not work right now - re-test once daemon is fixed?
    file: Flags.string({required: false}),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Deploy)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${discoConfig.host}/.disco/projects/${flags.project}/deployments`

    const discoFile = flags.file ? await fs.promises.readFile(flags.file, 'utf8') : undefined
    const reqBody: DeployRequest = {}
    if (flags.commit) {
      reqBody.commit = flags.commit
    }

    if (discoFile) {
      reqBody.discoFile = discoFile
    }

    const res = await request({method: 'POST', url, body: reqBody, discoConfig, expectedStatuses: [201]})
    const data = await res.json()

    const deploymentUrl = `https://${discoConfig.host}/.disco/projects/${flags.project}/deployments/${data.deployment.number}/output`
    readEventSource(deploymentUrl, discoConfig, {
      onMessage(event: MessageEvent) {
        const message = JSON.parse(event.data)
        process.stdout.write(message.text)
      },
    })
  }
}
