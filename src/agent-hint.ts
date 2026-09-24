import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

// When a command fails inside a coding agent (claude code, cursor, codex,
// gemini cli...), one line points at the disco skill: the deploy loop, the
// disco.json shapes and the gotchas an agent would otherwise guess. Nothing is
// printed for humans, on success, or when the skill is already installed.

export const SKILL_INSTALL = 'npx skills add letsdiscodev/skills'
export const SKILL_URL = 'https://github.com/letsdiscodev/skills'

// the variables the agents set for their child processes
export const AGENT_VARIABLES = ['CLAUDECODE', 'CURSOR_AGENT', 'CODEX_SANDBOX', 'GEMINI_CLI', 'AI_AGENT']

export function isAgent(env: NodeJS.ProcessEnv): boolean {
  return AGENT_VARIABLES.some((name) => Boolean(env[name]))
}

// where the skills installer puts skills for every agent
export function skillInstalled(home: string = os.homedir()): boolean {
  return fs.existsSync(path.join(home, '.agents', 'skills', 'disco', 'SKILL.md'))
}

export function hintAfterFailure({
  error,
  env,
  home,
  log,
}: {
  error: Error | undefined
  env: NodeJS.ProcessEnv
  home?: string
  log: (line: string) => void
}): void {
  if (error === undefined || !isAgent(env) || skillInstalled(home)) {
    return
  }

  log(`Hint for coding agents: the disco skill has the deploy loop, the disco.json shapes and the gotchas. Install it with: ${SKILL_INSTALL} (${SKILL_URL})`)
}
