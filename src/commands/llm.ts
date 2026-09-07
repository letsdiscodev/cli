import {Command, Flags} from '@oclif/core'
import {existsSync, mkdirSync, writeFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {dirname, resolve} from 'node:path'

import {NARRATIVE} from '../llm/narrative.js'
import {
  expandTargets,
  installPath,
  renderCommands,
  renderFrontmatter,
  type CommandLike,
  type InstallTarget,
  type InstallTargetOrAll,
} from '../llm/render.js'

const LLMS_TXT_URL = 'https://disco.cloud/llms.txt'

export default class Llm extends Command {
  static description =
    'print a markdown bundle (narrative + command reference) for use with LLM coding agents'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --save',
    '<%= config.bin %> <%= command.id %> --install claude',
    '<%= config.bin %> <%= command.id %> --install all',
    '<%= config.bin %> <%= command.id %> --url',
  ]

  static flags = {
    save: Flags.boolean({
      description: 'write the markdown bundle to ./DISCO.md',
      exclusive: ['install', 'url'],
    }),
    install: Flags.string({
      description: 'install as an agent skill at the target path',
      exclusive: ['save', 'url'],
      options: ['claude', 'codex', 'all'],
    }),
    url: Flags.boolean({
      description: 'print the URL of the hosted llms.txt and exit',
      exclusive: ['save', 'install'],
    }),
    force: Flags.boolean({
      description: 'overwrite existing files when installing',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Llm)

    if (flags.url) {
      this.log(LLMS_TXT_URL)
      return
    }

    const body = renderBundle(this.config.commands as unknown as CommandLike[])

    if (flags.install) {
      this.runInstall(flags.install as InstallTargetOrAll, body, flags.force)
      return
    }

    if (flags.save) {
      const target = resolve(process.cwd(), 'DISCO.md')
      writeFileSync(target, body)
      this.log(`Wrote ${target}`)
      return
    }

    this.log(body)
  }

  private runInstall(target: InstallTargetOrAll, body: string, force: boolean): void {
    const targets = expandTargets(target)
    const home = homedir()
    const plans: Array<{path: string; target: InstallTarget}> = targets.map((t) => ({
      path: installPath(t, home),
      target: t,
    }))

    if (!force) {
      for (const {path} of plans) {
        if (existsSync(path)) {
          this.error(
            `File already exists: ${path}\n\nPass --force to overwrite, or back up the existing file first.`,
            {exit: 1},
          )
        }
      }
    }

    const content = renderFrontmatter() + body
    for (const {path, target: t} of plans) {
      mkdirSync(dirname(path), {recursive: true})
      writeFileSync(path, content)
      this.log(`Installed ${t} skill: ${path}`)
    }
  }
}

function renderBundle(commands: ReadonlyArray<CommandLike>): string {
  return [NARRATIVE.trimEnd(), '', renderCommands(commands), ''].join('\n')
}
