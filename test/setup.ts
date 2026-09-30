// tests never see the real ~/.disco/config.json: HOME is an empty temp dir
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

process.env.HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'disco-test-home-'))
delete process.env.DISCO_CONFIG_PATH
