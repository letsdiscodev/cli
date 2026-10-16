import {expect} from '@oclif/test'

import {extractApiKey, parseProvisionedDomain} from '../../src/commands/init.js'

describe('init utils', () => {
  describe('extractApiKey', () => {
    it('extracts the api key', () => {
      const apiKey = '1234567890abcdef1234567890abcdef'
      const output = `some output\nCreated API key: ${apiKey}\nsome output`
      expect(extractApiKey(output)).to.equal(apiKey)
    })
  })
  describe('parseProvisionedDomain', () => {
    const ip = '203.0.113.7'
    it('returns the domain when it points at the ssh ip', () => {
      expect(parseProvisionedDomain(JSON.stringify({domain: 'abc123.srv1.disco.cloud', 'public_ip': ip}), ip)).to.equal(
        'abc123.srv1.disco.cloud',
      )
    })
    for (const [name, output] of [
      ['not json', '<html>502</html>'],
      ['empty', ''],
      ['null', 'null'],
      ['no domain', JSON.stringify({'public_ip': ip})],
      ['empty domain', JSON.stringify({domain: '', 'public_ip': ip})],
      ['domain not a string', JSON.stringify({domain: 7, 'public_ip': ip})],
      ['shell in domain', JSON.stringify({domain: 'a.disco.cloud"; rm -rf /', 'public_ip': ip})],
      ['space in domain', JSON.stringify({domain: 'a b.disco.cloud', 'public_ip': ip})],
      ['uppercase domain', JSON.stringify({domain: 'A.disco.cloud', 'public_ip': ip})],
      ['bare label', JSON.stringify({domain: 'localhost', 'public_ip': ip})],
      ['an ip as domain', JSON.stringify({domain: '203.0.113.7', 'public_ip': ip})],
      ['other ip', JSON.stringify({domain: 'abc.srv1.disco.cloud', 'public_ip': '198.51.100.1'})],
      ['no ip', JSON.stringify({domain: 'abc.srv1.disco.cloud'})],
    ]) {
      it(`refuses: ${name}`, () => {
        expect(() => parseProvisionedDomain(output, ip)).to.throw()
      })
    }
  })
})
