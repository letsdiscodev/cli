import {expect} from '@oclif/test'

import {extractApiKey, extractPublicKeyCertificate} from '../../src/commands/init'

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
