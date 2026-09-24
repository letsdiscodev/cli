import {Hook} from '@oclif/core'

import {hintAfterFailure} from '../../agent-hint.js'

const hook: Hook.Finally = async function (options) {
  hintAfterFailure({error: options.error, env: process.env, log: (line) => process.stderr.write(`${line}\n`)})
}

export default hook
