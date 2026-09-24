import {Hook} from '@oclif/core'
import * as fs from 'node:fs'
import * as path from 'node:path'

// After `disco update`: the shell completion files are a snapshot of the
// command set taken when `disco autocomplete` last ran, so rebuild them for
// the version that was just installed. plugin-update reloads the config from
// the new install before firing this hook, so the command set is the new one.
// Only when the user set autocomplete up at some point (the folder exists).

export const autocompleteFolder = (cacheDir: string) => path.join(cacheDir, 'autocomplete', 'functions')

const hook: Hook.Update = async function (options) {
  const {config} = options
  if (!fs.existsSync(autocompleteFolder(config.cacheDir))) {
    return
  }

  try {
    await config.runCommand('autocomplete:create')
  } catch {
    // completion is a convenience, a failure here must not fail the update
  }
}

export default hook
