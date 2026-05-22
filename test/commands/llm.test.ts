import {expect} from '@oclif/test'

import {
  expandTargets,
  installPath,
  renderCommands,
  renderFrontmatter,
  type CommandLike,
} from '../../src/llm/render.js'

describe('llm render', () => {
  describe('expandTargets', () => {
    it('expands "all" to claude + codex', () => {
      expect(expandTargets('all')).to.deep.equal(['claude', 'codex'])
    })

    it('returns single-element array for a specific target', () => {
      expect(expandTargets('claude')).to.deep.equal(['claude'])
      expect(expandTargets('codex')).to.deep.equal(['codex'])
    })
  })

  describe('installPath', () => {
    it('resolves the claude skill path under HOME', () => {
      expect(installPath('claude', '/tmp/h')).to.equal('/tmp/h/.claude/skills/disco/SKILL.md')
    })

    it('resolves the codex skill path under HOME', () => {
      expect(installPath('codex', '/tmp/h')).to.equal('/tmp/h/.codex/skills/disco/SKILL.md')
    })
  })

  describe('renderFrontmatter', () => {
    it('emits YAML frontmatter with name and description', () => {
      const out = renderFrontmatter()
      expect(out).to.match(/^---\n/)
      expect(out).to.include('name: disco')
      expect(out).to.include('description:')
      expect(out).to.match(/---\n$/)
    })
  })

  describe('renderCommands', () => {
    const sampleCommands: CommandLike[] = [
      {
        description: 'deploy a project',
        examples: ['<%= config.bin %> <%= command.id %> --project mysite'],
        flags: {
          commit: {description: 'git commit sha'},
          project: {description: 'project name', required: true},
        },
        id: 'deploy',
      },
      {
        description: 'fetch logs',
        flags: {project: {required: false}},
        id: 'logs',
      },
      {
        description: 'should be skipped',
        hidden: true,
        id: 'secret',
      },
      {
        description: 'self — should be skipped',
        id: 'llm',
      },
      {
        description: 'add a project',
        id: 'projects:add',
      },
    ]

    it('emits a top-level Commands header', () => {
      expect(renderCommands(sampleCommands)).to.match(/^# Commands\n/)
    })

    it('skips hidden commands and the llm command itself', () => {
      const out = renderCommands(sampleCommands)
      expect(out).to.not.include('secret')
      expect(out).to.not.include('## disco llm')
    })

    it('renders commands sorted alphabetically by id', () => {
      const out = renderCommands(sampleCommands)
      const deployIdx = out.indexOf('## disco deploy')
      const logsIdx = out.indexOf('## disco logs')
      const projectsIdx = out.indexOf('## disco projects add')
      expect(deployIdx).to.be.greaterThan(-1)
      expect(logsIdx).to.be.greaterThan(deployIdx)
      expect(projectsIdx).to.be.greaterThan(logsIdx)
    })

    it('renders topic separators as spaces in headings', () => {
      expect(renderCommands(sampleCommands)).to.include('## disco projects add')
    })

    it('marks required flags', () => {
      const out = renderCommands(sampleCommands)
      expect(out).to.include('`--project` (required)')
    })

    it('resolves oclif example template tokens', () => {
      const out = renderCommands(sampleCommands)
      expect(out).to.include('`disco deploy --project mysite`')
    })
  })
})
