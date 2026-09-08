import {Command, Flags} from '@oclif/core'
import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as tar from 'tar'

import {getDisco, DiscoConfig} from '../config.js'
import {request, readEventSource} from '../auth-request.js'
import {isIgnored, loadDockerignore} from '../dockerignore.js'

interface DeployRequest {
  commit?: string
}

export interface DeployResponse {
  deployment: {
    number: number
  }
}

export default class Deploy extends Command {
  static override description = 'deploy a project: a commit of its repository, or the files of a directory'

  static override examples = [
    '<%= config.bin %> <%= command.id %> --project mysite',
    '<%= config.bin %> <%= command.id %> --project mysite --commit 7b5c8f935328c1af49c9037cac9dee7bf0bd8c7e',
    '<%= config.bin %> <%= command.id %> --project mysite --dir .',
  ]

  static override flags = {
    project: Flags.string({required: true}),
    commit: Flags.string({required: false, exclusive: ['dir']}),
    dir: Flags.string({
      required: false,
      description:
        'send the files of this directory and deploy them. ' +
        'The directory must contain disco.json; .dockerignore is honored, .git is never sent',
    }),
    disco: Flags.string({required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Deploy)
    const discoConfig = getDisco(flags.disco || null)

    const deployment = flags.dir
      ? await this.deployDir(discoConfig, flags.project, path.resolve(flags.dir))
      : await this.deployCommit(discoConfig, flags.project, flags.commit)

    const deploymentUrl = `https://${discoConfig.host}/api/projects/${flags.project}/deployments/${deployment.number}/output`
    readEventSource(deploymentUrl, discoConfig, {
      onMessage(event: MessageEvent) {
        const message = JSON.parse(event.data)
        process.stdout.write(message.text)
      },
    })
  }

  private async deployCommit(
    discoConfig: DiscoConfig,
    project: string,
    commit: string | undefined,
  ): Promise<DeployResponse['deployment']> {
    const url = `https://${discoConfig.host}/api/projects/${project}/deployments`
    const reqBody: DeployRequest = {}
    if (commit) {
      reqBody.commit = commit
    }

    const res = await request({method: 'POST', url, body: reqBody, discoConfig, expectedStatuses: [201]})
    const data = (await res.json()) as DeployResponse
    return data.deployment
  }

  private async deployDir(
    discoConfig: DiscoConfig,
    project: string,
    directory: string,
  ): Promise<DeployResponse['deployment']> {
    if (!fs.existsSync(path.join(directory, 'disco.json'))) {
      this.error(`No disco.json in ${directory}`)
    }

    const patterns = loadDockerignore(directory)
    const archivePath = path.join(os.tmpdir(), `disco-deploy-${crypto.randomBytes(4).toString('hex')}.tar.gz`)
    try {
      let fileCount = 0
      await tar.c(
        {
          cwd: directory,
          file: archivePath,
          gzip: true,
          portable: true,
          filter(entryPath: string, stat: fs.Stats | tar.ReadEntry) {
            const relativePath = entryPath.replace(/^\.\/?/, '')
            if (relativePath === '') {
              return true
            }

            if (isIgnored(patterns, relativePath)) {
              return false
            }

            if (stat instanceof fs.Stats && stat.isFile()) {
              fileCount++
            }

            return true
          },
        },
        ['.'],
      )
      const {size} = fs.statSync(archivePath)
      this.log(`Sending ${fileCount} file(s) from ${directory}, ${formatSize(size)} compressed`)

      const url = `https://${discoConfig.host}/api/projects/${project}/files`
      const res = await request({
        method: 'POST',
        url,
        discoConfig,
        bodyStream: fs.createReadStream(archivePath),
        // Content-Length rather than a chunked stream: see volumes:import
        extraHeaders: {'Content-Type': 'application/gzip', 'Content-Length': size.toString()},
        expectedStatuses: [201],
      })
      const data = (await res.json()) as DeployResponse
      this.log(`Deploying ${project}, version ${data.deployment.number}`)
      return data.deployment
    } finally {
      fs.rmSync(archivePath, {force: true})
    }
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
