// tests never see the real ~/.disco/config.json: HOME is an empty temp dir.
// the permission fixes of the config files the tests write are silent
// (config.test.ts captures them where they are the point)
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import {permissions} from '../src/config.js'

process.env.HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'disco-test-home-'))
delete process.env.DISCO_CONFIG_PATH
permissions.warn = () => {}
