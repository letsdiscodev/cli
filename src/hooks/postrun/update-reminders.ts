import {Hook} from '@oclif/core'

import {checkForUpdates} from '../../update-reminders.js'

const hook: Hook.Postrun = async function (options) {
  const {Command, argv, config} = options
  const s3Host = (config.pjson.oclif as {update?: {s3?: {host?: string}}}).update?.s3?.host
  await checkForUpdates({
    argv,
    commandHasDiscoFlag: 'disco' in (Command.flags ?? {}),
    env: process.env,
    now: Date.now(),
    cli: {
      bin: config.bin,
      version: config.version,
      manifestUrl: s3Host ? `${s3Host}channels/${config.channel}/${config.bin}-${config.platform}-${config.arch}-buildmanifest` : null,
    },
    log: (line) => process.stderr.write(`${line}\n`),
  })
}

export default hook
