import {expect, test} from '@oclif/test'

import {extractApiKey, extractPublicKeyCertificate} from '../../src/commands/init'

describe.skip('init', () => {
  test
    .stdout()
    .command(['init'])
    .it('runs hello', (ctx) => {
      expect(ctx.stdout).to.contain('hello world')
    })

  test
    .stdout()
    .command(['init', '--name', 'jeff'])
    .it('runs hello --name jeff', (ctx) => {
      expect(ctx.stdout).to.contain('hello jeff')
    })
})

describe('init utils', () => {
  describe('extractApiKey', () => {
    it('extracts the api key', () => {
      const apiKey = '1234567890abcdef1234567890abcdef'
      const output = `some output\nCreated API key: ${apiKey}\nsome output`
      expect(extractApiKey(output)).to.equal(apiKey)
    })
  })

  describe('extractPublicKeyCertificate', () => {
    it('extracts the certificate public key', () => {
      const certificate = '-----BEGIN CERTIFICATE-----\nabc\n123\n-----END CERTIFICATE-----'
      const output = `some output\n${certificate}\nmore output`
      expect(extractPublicKeyCertificate(output)).to.equal(certificate)
    })
  })
})
