import {expect} from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import {AGENT_VARIABLES, SKILL_INSTALL, hintAfterFailure, isAgent, skillInstalled} from '../src/agent-hint.js'

// a home with or without the skill installed
function home(withSkill: boolean): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'disco-home-'))
  if (withSkill) {
    fs.mkdirSync(path.join(dir, '.agents', 'skills', 'disco'), {recursive: true})
    fs.writeFileSync(path.join(dir, '.agents', 'skills', 'disco', 'SKILL.md'), '---\nname: disco\n---\n')
  }

  return dir
}

function run(options: {error: Error | undefined; env: NodeJS.ProcessEnv; home: string}): string[] {
  const lines: string[] = []
  hintAfterFailure({...options, log: (line) => lines.push(line)})
  return lines
}

describe('agent hint', () => {
  describe('isAgent', () => {
    it('is true for each known variable, whatever its value', () => {
      for (const name of AGENT_VARIABLES) {
        expect(isAgent({[name]: '1'}), name).to.equal(true)
        expect(isAgent({[name]: 'seatbelt'}), name).to.equal(true)
      }
    })

    it('is false with none of them, or with an empty value', () => {
      expect(isAgent({})).to.equal(false)
      expect(isAgent({PATH: '/bin', TERM_PROGRAM: 'iTerm.app'})).to.equal(false)
      expect(isAgent({CLAUDECODE: ''})).to.equal(false)
    })
  })

  describe('skillInstalled', () => {
    it('sees the skill only when SKILL.md is there', () => {
      expect(skillInstalled(home(true))).to.equal(true)
      expect(skillInstalled(home(false))).to.equal(false)
    })
  })

  describe('hintAfterFailure', () => {
    const failure = new Error('command nope not found')

    it('prints the install line when a command failed inside an agent without the skill', () => {
      const lines = run({error: failure, env: {CLAUDECODE: '1'}, home: home(false)})
      expect(lines).to.have.length(1)
      expect(lines[0]).to.contain(SKILL_INSTALL)
    })

    it('prints nothing on success', () => {
      expect(run({error: undefined, env: {CLAUDECODE: '1'}, home: home(false)})).to.deep.equal([])
    })

    it('prints nothing for a human', () => {
      expect(run({error: failure, env: {TERM_PROGRAM: 'iTerm.app'}, home: home(false)})).to.deep.equal([])
    })

    it('prints nothing when the skill is already installed', () => {
      expect(run({error: failure, env: {CLAUDECODE: '1'}, home: home(true)})).to.deep.equal([])
    })
  })
})
