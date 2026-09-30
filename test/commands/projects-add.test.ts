import {expect, test} from '@oclif/test'

// flag parsing only: these fail before any config is read or any request is made
describe('projects:add flags', () => {
  test
    .command(['projects:add', '--name', 'x', '--domain', 'a.example.test', '--no-domain'])
    .catch((error) => {
      expect(error.message).to.contain('--no-domain')
      expect(error.message).to.contain('--domain')
    })
    .it('--domain and --no-domain are exclusive')

  test
    .command(['projects:add', '--domain', 'a.example.test'])
    .catch((error) => {
      expect(error.message).to.contain('Missing required flag')
      expect(error.message).to.contain('name')
    })
    .it('--name is still required')

  test
    .command(['projects:add', '--name', 'a'.repeat(43)])
    .catch((error) => {
      expect(error.message).to.contain('42 characters or fewer')
    })
    .it('rejects a name longer than 42 characters')

  test
    // invalid --github so it still stops before reading any config
    .command(['projects:add', '--name', 'a'.repeat(42), '--github', 'not-a-repo'])
    .catch((error) => {
      expect(error.message).to.contain('Invalid Github repository format')
    })
    .it('accepts a name of 42 characters')
})
