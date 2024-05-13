cli
=================

deploy and manage your web projects


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/cli.svg)](https://npmjs.org/package/cli)
[![Downloads/week](https://img.shields.io/npm/dw/cli.svg)](https://npmjs.org/package/cli)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g disco
$ disco COMMAND
running command...
$ disco (--version)
disco/0.5.1 linux-x64 node-v18.20.2
$ disco --help [COMMAND]
USAGE
  $ disco COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`disco help [COMMAND]`](#disco-help-command)
* [`disco plugins`](#disco-plugins)
* [`disco plugins:add PLUGIN`](#disco-pluginsadd-plugin)
* [`disco plugins:inspect PLUGIN...`](#disco-pluginsinspect-plugin)
* [`disco plugins:install PLUGIN`](#disco-pluginsinstall-plugin)
* [`disco plugins:link PATH`](#disco-pluginslink-path)
* [`disco plugins:remove [PLUGIN]`](#disco-pluginsremove-plugin)
* [`disco plugins:reset`](#disco-pluginsreset)
* [`disco plugins:uninstall [PLUGIN]`](#disco-pluginsuninstall-plugin)
* [`disco plugins:unlink [PLUGIN]`](#disco-pluginsunlink-plugin)
* [`disco plugins:update`](#disco-pluginsupdate)

## `disco help [COMMAND]`

Display help for disco.

```
USAGE
  $ disco help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for disco.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.0.21/src/commands/help.ts)_

## `disco plugins`

List installed plugins.

```
USAGE
  $ disco plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ disco plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.0.18/src/commands/plugins/index.ts)_

## `disco plugins:add PLUGIN`

Installs a plugin into disco.

```
USAGE
  $ disco plugins:add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into disco.

  Uses bundled npm executable to install plugins into /home/runner/.local/share/disco

  Installation of a user-installed plugin will override a core plugin.

  Use the DISCO_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the DISCO_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ disco plugins:add

EXAMPLES
  Install a plugin from npm registry.

    $ disco plugins:add myplugin

  Install a plugin from a github url.

    $ disco plugins:add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ disco plugins:add someuser/someplugin
```

## `disco plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ disco plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ disco plugins:inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.0.18/src/commands/plugins/inspect.ts)_

## `disco plugins:install PLUGIN`

Installs a plugin into disco.

```
USAGE
  $ disco plugins:install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into disco.

  Uses bundled npm executable to install plugins into /home/runner/.local/share/disco

  Installation of a user-installed plugin will override a core plugin.

  Use the DISCO_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the DISCO_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ disco plugins:add

EXAMPLES
  Install a plugin from npm registry.

    $ disco plugins:install myplugin

  Install a plugin from a github url.

    $ disco plugins:install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ disco plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.0.18/src/commands/plugins/install.ts)_

## `disco plugins:link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ disco plugins:link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ disco plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.0.18/src/commands/plugins/link.ts)_

## `disco plugins:remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ disco plugins:remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ disco plugins:unlink
  $ disco plugins:remove

EXAMPLES
  $ disco plugins:remove myplugin
```

## `disco plugins:reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ disco plugins:reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.0.18/src/commands/plugins/reset.ts)_

## `disco plugins:uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ disco plugins:uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ disco plugins:unlink
  $ disco plugins:remove

EXAMPLES
  $ disco plugins:uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.0.18/src/commands/plugins/uninstall.ts)_

## `disco plugins:unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ disco plugins:unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ disco plugins:unlink
  $ disco plugins:remove

EXAMPLES
  $ disco plugins:unlink myplugin
```

## `disco plugins:update`

Update installed plugins.

```
USAGE
  $ disco plugins:update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.0.18/src/commands/plugins/update.ts)_
<!-- commandsstop -->