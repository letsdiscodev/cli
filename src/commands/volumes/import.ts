import {Command, Flags} from '@oclif/core'

import {getDisco} from '../../config'
import {request} from '../../auth-request'

import * as fs from 'node:fs'

export default class VolumesImport extends Command {
  static override description = 'describe the command here'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  static override flags = {
    project: Flags.string({required: true}),
    disco: Flags.string({required: false}),
    volume: Flags.string({required: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(VolumesImport)
    const discoConfig = getDisco(flags.disco || null)
    const url = `https://${getDisco(flags.disco || null).host}/.disco/projects/${flags.project}/volumes/${flags.volume}`

    // weird hack to fully read stdin
    // https://stackoverflow.com/a/56012724
    // const stdin = fs.readFileSync(process.stdin.fd, 'binary')
    // this.log('stdin.length', stdin.length)

    const res = await request({method: 'PUT', url, discoConfig, bodyStream: process.stdin})
    await res.json()
  }
}
