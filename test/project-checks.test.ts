import {expect} from '@oclif/test'

import {missingDiscoJsonMessage} from '../src/project-checks.js'

describe('missingDiscoJsonMessage', () => {
  it('names the place, the docs and the example', () => {
    const m = missingDiscoJsonMessage('/tmp/app')
    expect(m).to.contain('No disco.json in /tmp/app')
    expect(m).to.contain('https://disco.cloud/docs/disco-json/')
    expect(m).to.contain('example-flask-site')
  })
})
