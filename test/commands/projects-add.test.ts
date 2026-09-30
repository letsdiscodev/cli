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
})
