import {expect} from '@oclif/test'

import {extractApiKey} from '../../src/commands/init.js'

describe('init utils', () => {
  describe('extractApiKey', () => {
    it('extracts the api key', () => {
      const apiKey = '1234567890abcdef1234567890abcdef'
      const output = `some output\nCreated API key: ${apiKey}\nsome output`
      expect(extractApiKey(output)).to.equal(apiKey)
    })
  })
})
