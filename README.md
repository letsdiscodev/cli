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
* [`disco help [COMMAND]`](#disco-help-command)
* [`disco init SSHSTRING`](#disco-init-sshstring)
* [`disco logs`](#disco-logs)
* [`disco meta host DOMAIN`](#disco-meta-host-domain)
* [`disco meta info`](#disco-meta-info)
* [`disco meta upgrade`](#disco-meta-upgrade)
* [`disco projects add`](#disco-projects-add)
* [`disco projects list`](#disco-projects-list)
* [`disco projects remove [PROJECT]`](#disco-projects-remove-project)

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

## `disco init SSHSTRING`

initializes a new server

```
USAGE
  $ disco init SSHSTRING [--version <value>]

FLAGS
  --version=<value>  [default: latest] version of disco daemon to install

DESCRIPTION
  initializes a new server

EXAMPLES
  $ disco init root@12.34.56.78
```

_See code: [src/commands/init.ts](https://github.com/letsdiscodev/cli/blob/v0.0.0/src/commands/init.ts)_

## `disco logs`

fetch logs

```
USAGE
  $ disco logs [--project <value>] [--service <value>] [--disco <value>]

FLAGS
  --disco=<value>
  --project=<value>
  --service=<value>

DESCRIPTION
  fetch logs

EXAMPLES
  $ disco logs
```

_See code: [src/commands/logs.ts](https://github.com/letsdiscodev/cli/blob/v0.0.0/src/commands/logs.ts)_

## `disco meta host DOMAIN`

set a host for the server

```
USAGE
  $ disco meta host DOMAIN [--disco <value>]

FLAGS
  --disco=<value>

DESCRIPTION
  set a host for the server

EXAMPLES
  $ disco meta host example.com
```

_See code: [src/commands/meta/host.ts](https://github.com/letsdiscodev/cli/blob/v0.0.0/src/commands/meta/host.ts)_

## `disco meta info`

fetch info about the server

```
USAGE
  $ disco meta info [--disco <value>]

FLAGS
  --disco=<value>

DESCRIPTION
  fetch info about the server

EXAMPLES
  $ disco meta info
```

_See code: [src/commands/meta/info.ts](https://github.com/letsdiscodev/cli/blob/v0.0.0/src/commands/meta/info.ts)_

## `disco meta upgrade`

upgrade server

```
USAGE
  $ disco meta upgrade [--image <value>] [--dontPull] [--disco <value>]

FLAGS
  --disco=<value>
  --dontPull       don't pull the image before upgrading
  --image=<value>  the image to use. Defaults to letsdiscodev/daemon:latest

DESCRIPTION
  upgrade server

EXAMPLES
  $ disco meta upgrade
```

_See code: [src/commands/meta/upgrade.ts](https://github.com/letsdiscodev/cli/blob/v0.0.0/src/commands/meta/upgrade.ts)_

## `disco projects add`

add a project

```
USAGE
  $ disco projects add --name <value> [--domain <value>] [--github-repo <value>] [--disco <value>] [--deploy]

FLAGS
  --deploy               deploy the project after adding it
  --disco=<value>        server to use
  --domain=<value>       domain name where the app will be served, e.g. www.example.com
  --github-repo=<value>  URL used to clone the repo, e.g. git@github.com:example/example.git
  --name=<value>         (required) project name

DESCRIPTION
  add a project

EXAMPLES
  $ disco projects add
```

_See code: [src/commands/projects/add.ts](https://github.com/letsdiscodev/cli/blob/v0.0.0/src/commands/projects/add.ts)_

## `disco projects list`

list projects

```
USAGE
  $ disco projects list [--disco <value>]

FLAGS
  --disco=<value>

DESCRIPTION
  list projects

EXAMPLES
  $ disco projects list
```

_See code: [src/commands/projects/list.ts](https://github.com/letsdiscodev/cli/blob/v0.0.0/src/commands/projects/list.ts)_

## `disco projects remove [PROJECT]`

remove a project

```
USAGE
  $ disco projects remove [PROJECT] [--disco <value>]

ARGUMENTS
  PROJECT  project to remove

FLAGS
  --disco=<value>

DESCRIPTION
  remove a project

EXAMPLES
  $ disco projects remove project-name
```

_See code: [src/commands/projects/remove.ts](https://github.com/letsdiscodev/cli/blob/v0.0.0/src/commands/projects/remove.ts)_
<!-- commandsstop -->
