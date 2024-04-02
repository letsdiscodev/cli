oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![GitHub license](https://img.shields.io/github/license/oclif/hello-world)](https://github.com/oclif/hello-world/blob/main/LICENSE)

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
disco/0.0.0 darwin-arm64 node-v20.8.0
$ disco --help [COMMAND]
USAGE
  $ disco COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`disco hello PERSON`](#disco-hello-person)
* [`disco hello world`](#disco-hello-world)
* [`disco help [COMMAND]`](#disco-help-command)
* [`disco plugins`](#disco-plugins)
* [`disco plugins:install PLUGIN...`](#disco-pluginsinstall-plugin)
* [`disco plugins:inspect PLUGIN...`](#disco-pluginsinspect-plugin)
* [`disco plugins:install PLUGIN...`](#disco-pluginsinstall-plugin-1)
* [`disco plugins:link PLUGIN`](#disco-pluginslink-plugin)
* [`disco plugins:uninstall PLUGIN...`](#disco-pluginsuninstall-plugin)
* [`disco plugins reset`](#disco-plugins-reset)
* [`disco plugins:uninstall PLUGIN...`](#disco-pluginsuninstall-plugin-1)
* [`disco plugins:uninstall PLUGIN...`](#disco-pluginsuninstall-plugin-2)
* [`disco plugins update`](#disco-plugins-update)

## `disco hello PERSON`

Say hello

```
USAGE
  $ disco hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/letsdiscodev/cli/blob/v0.0.0/src/commands/hello/index.ts)_

## `disco hello world`

Say hello world

```
USAGE
  $ disco hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ disco hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/letsdiscodev/cli/blob/v0.0.0/src/commands/hello/world.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.0.20/src/commands/help.ts)_

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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.3.10/src/commands/plugins/index.ts)_

## `disco plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ disco plugins add plugins:install PLUGIN...

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -s, --silent   Silences yarn output.
  -v, --verbose  Show verbose yarn output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ disco plugins add

EXAMPLES
  $ disco plugins add myplugin 

  $ disco plugins add https://github.com/someuser/someplugin

  $ disco plugins add someuser/someplugin
```

## `disco plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ disco plugins inspect PLUGIN...

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
  $ disco plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.3.10/src/commands/plugins/inspect.ts)_

## `disco plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ disco plugins install PLUGIN...

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -s, --silent   Silences yarn output.
  -v, --verbose  Show verbose yarn output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ disco plugins add

EXAMPLES
  $ disco plugins install myplugin 

  $ disco plugins install https://github.com/someuser/someplugin

  $ disco plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.3.10/src/commands/plugins/install.ts)_

## `disco plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ disco plugins link PLUGIN

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
  $ disco plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.3.10/src/commands/plugins/link.ts)_

## `disco plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ disco plugins remove plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ disco plugins unlink
  $ disco plugins remove

EXAMPLES
  $ disco plugins remove myplugin
```

## `disco plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ disco plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.3.10/src/commands/plugins/reset.ts)_

## `disco plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ disco plugins uninstall PLUGIN...

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ disco plugins unlink
  $ disco plugins remove

EXAMPLES
  $ disco plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.3.10/src/commands/plugins/uninstall.ts)_

## `disco plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ disco plugins unlink plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ disco plugins unlink
  $ disco plugins remove

EXAMPLES
  $ disco plugins unlink myplugin
```

## `disco plugins update`

Update installed plugins.

```
USAGE
  $ disco plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.3.10/src/commands/plugins/update.ts)_
<!-- commandsstop -->
