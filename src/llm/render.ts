export type InstallTarget = 'claude' | 'codex'
export type InstallTargetOrAll = 'all' | InstallTarget

export function expandTargets(target: InstallTargetOrAll): InstallTarget[] {
  return target === 'all' ? ['claude', 'codex'] : [target]
}

export function installPath(target: InstallTarget, home: string): string {
  const dir = target === 'claude' ? '.claude' : '.codex'
  return `${home}/${dir}/skills/disco/SKILL.md`
}

export function renderFrontmatter(): string {
  return [
    '---',
    'name: disco',
    'description: Disco CLI — deploy and manage projects on a server you control, with zero-downtime deployments. Use these commands to drive disco from a coding agent.',
    '---',
    '',
  ].join('\n')
}

interface FlagDef {
  description?: string
  required?: boolean
  options?: readonly string[]
  char?: string
  type?: string
}

interface ArgDef {
  description?: string
  required?: boolean
}

export interface CommandLike {
  id: string
  description?: string
  summary?: string
  examples?: ReadonlyArray<{command: string; description?: string} | string>
  flags?: Record<string, FlagDef>
  args?: Record<string, ArgDef>
  hidden?: boolean
}

export function renderCommands(commands: ReadonlyArray<CommandLike>): string {
  const visible = commands.filter((c) => !c.hidden && c.id !== 'llm').sort((a, b) => a.id.localeCompare(b.id))

  return ['# Commands', '', ...visible.map((cmd) => renderCommand(cmd))].join('\n')
}

function renderCommand(cmd: CommandLike): string {
  const heading = `## disco ${cmd.id.replaceAll(':', ' ')}`
  const lines: string[] = [heading, '']

  const desc = cmd.summary ?? cmd.description
  if (desc) {
    lines.push(desc, '')
  }

  const flagNames = Object.keys(cmd.flags ?? {}).sort()
  if (flagNames.length > 0) {
    lines.push('**Flags:**')
    for (const name of flagNames) {
      const f = (cmd.flags as Record<string, FlagDef>)[name]
      const req = f.required ? ' (required)' : ''
      const opts = f.options && f.options.length > 0 ? ` [${f.options.join('|')}]` : ''
      const description = f.description ? ` — ${f.description}` : ''
      lines.push(`- \`--${name}\`${opts}${req}${description}`)
    }

    lines.push('')
  }

  const argNames = Object.keys(cmd.args ?? {})
  if (argNames.length > 0) {
    lines.push('**Args:**')
    for (const name of argNames) {
      const a = (cmd.args as Record<string, ArgDef>)[name]
      const req = a.required ? ' (required)' : ''
      const description = a.description ? ` — ${a.description}` : ''
      lines.push(`- \`${name}\`${req}${description}`)
    }

    lines.push('')
  }

  const examples = cmd.examples ?? []
  if (examples.length > 0) {
    lines.push('**Examples:**')
    for (const ex of examples) {
      const cmdText = typeof ex === 'string' ? ex : ex.command
      const resolved = cmdText.replaceAll('<%= config.bin %>', 'disco').replaceAll('<%= command.id %>', cmd.id)
      lines.push(`- \`${resolved}\``)
    }

    lines.push('')
  }

  return lines.join('\n')
}
