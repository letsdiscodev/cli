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
disco/0.4.1 darwin-arm64 node-v20.8.0
$ disco --help [COMMAND]
USAGE
  $ disco COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`disco apikeys:list`](#disco-apikeyslist)
* [`disco apikeys:remove [PUBLICKEY]`](#disco-apikeysremove-publickey)
* [`disco deploy`](#disco-deploy)
* [`disco deploy:list`](#disco-deploylist)
* [`disco deploy:output`](#disco-deployoutput)
* [`disco env:get [ENVVAR]`](#disco-envget-envvar)
* [`disco env:list`](#disco-envlist)
* [`disco env:remove [ENVVAR]`](#disco-envremove-envvar)
* [`disco env:set [VARIABLES]`](#disco-envset-variables)
* [`disco help [COMMAND]`](#disco-help-command)
* [`disco init SSHSTRING`](#disco-init-sshstring)
* [`disco invite:accept URL`](#disco-inviteaccept-url)
* [`disco invite:create NAME`](#disco-invitecreate-name)
* [`disco logs`](#disco-logs)
* [`disco meta:host DOMAIN`](#disco-metahost-domain)
* [`disco meta:info`](#disco-metainfo)
* [`disco meta:upgrade`](#disco-metaupgrade)
* [`disco nodes:add SSHSTRING`](#disco-nodesadd-sshstring)
* [`disco projects:add`](#disco-projectsadd)
* [`disco projects:list`](#disco-projectslist)
* [`disco projects:move`](#disco-projectsmove)
* [`disco projects:remove [PROJECT]`](#disco-projectsremove-project)
* [`disco run [COMMAND]`](#disco-run-command)
* [`disco runcommand [PROJECT] [COMMAND] [ARGS]`](#disco-runcommand-project-command-args)
* [`disco scale SERVICES`](#disco-scale-services)
* [`disco syslog:add [SYSLOGDESTINATION]`](#disco-syslogadd-syslogdestination)
* [`disco syslog:list`](#disco-sysloglist)
* [`disco syslog:remove [SYSLOGDESTINATION]`](#disco-syslogremove-syslogdestination)
* [`disco volumes:export`](#disco-volumesexport)
* [`disco volumes:import`](#disco-volumesimport)
* [`disco volumes:list`](#disco-volumeslist)

## `disco apikeys:list`

list all api keys

```
USAGE
  $ disco apikeys:list [--disco <value>]

FLAGS
  --disco=<value>

DESCRIPTION
  list all api keys

EXAMPLES
  $ disco apikeys:list
```

_See code: [src/commands/apikeys/list.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/apikeys/list.ts)_

## `disco apikeys:remove [PUBLICKEY]`

remove an api key

```
USAGE
  $ disco apikeys:remove [PUBLICKEY] [--disco <value>]

ARGUMENTS
  PUBLICKEY  public api key

FLAGS
  --disco=<value>

DESCRIPTION
  remove an api key

EXAMPLES
  $ disco apikeys:remove API_KEY
```

_See code: [src/commands/apikeys/remove.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/apikeys/remove.ts)_

## `disco deploy`

deploy a project, a specific commit or a disco.json file

```
USAGE
  $ disco deploy --project <value> [--commit <value>] [--file <value>] [--disco <value>]

FLAGS
  --commit=<value>
  --disco=<value>
  --file=<value>
  --project=<value>  (required)

DESCRIPTION
  deploy a project, a specific commit or a disco.json file

EXAMPLES
  $ disco deploy --project mysite

  $ disco deploy --project mysite --commit 7b5c8f935328c1af49c9037cac9dee7bf0bd8c7e
```

_See code: [src/commands/deploy.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/deploy.ts)_

## `disco deploy:list`

list the deployments for a project

```
USAGE
  $ disco deploy:list --project <value> [--disco <value>]

FLAGS
  --disco=<value>
  --project=<value>  (required)

DESCRIPTION
  list the deployments for a project

EXAMPLES
  $ disco deploy:list --project mysite
```

_See code: [src/commands/deploy/list.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/deploy/list.ts)_

## `disco deploy:output`

see the output of the latest deployment, or a particular deployment

```
USAGE
  $ disco deploy:output --project <value> [--deployment <value>] [--disco <value>]

FLAGS
  --deployment=<value>
  --disco=<value>
  --project=<value>     (required)

DESCRIPTION
  see the output of the latest deployment, or a particular deployment

EXAMPLES
  $ disco deploy:output --project mysite

  $ disco deploy:output --project mysite --deployment 4
```

_See code: [src/commands/deploy/output.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/deploy/output.ts)_

## `disco env:get [ENVVAR]`

read the environment variables

```
USAGE
  $ disco env:get [ENVVAR] --project <value> [--disco <value>]

ARGUMENTS
  ENVVAR  environment variable to read

FLAGS
  --disco=<value>
  --project=<value>  (required)

DESCRIPTION
  read the environment variables

EXAMPLES
  $ disco env:get --project mysite API_KEY
```

_See code: [src/commands/env/get.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/env/get.ts)_

## `disco env:list`

list the env vars

```
USAGE
  $ disco env:list --project <value> [--disco <value>]

FLAGS
  --disco=<value>
  --project=<value>  (required)

DESCRIPTION
  list the env vars

EXAMPLES
  $ disco env:list --project mysite
```

_See code: [src/commands/env/list.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/env/list.ts)_

## `disco env:remove [ENVVAR]`

remove the env var

```
USAGE
  $ disco env:remove [ENVVAR] --project <value> [--disco <value>]

ARGUMENTS
  ENVVAR  variable to remove

FLAGS
  --disco=<value>
  --project=<value>  (required)

DESCRIPTION
  remove the env var

EXAMPLES
  $ disco env:remove --project mysite API_KEY
```

_See code: [src/commands/env/remove.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/env/remove.ts)_

## `disco env:set [VARIABLES]`

set env vars

```
USAGE
  $ disco env:set [VARIABLES...] --project <value> [--disco <value>]

ARGUMENTS
  VARIABLES...  variables to set

FLAGS
  --disco=<value>
  --project=<value>  (required)

DESCRIPTION
  set env vars

EXAMPLES
  $ disco env:set API_KEY=0x97BCD3

  $ disco env:set API_KEY=0x97BCD3 OTHER_API_KEY=sk_f98a7f97as896
```

_See code: [src/commands/env/set.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/env/set.ts)_

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
  $ disco init SSHSTRING [--version <value>] [--verbose]

FLAGS
  --verbose          show extra output
  --version=<value>  [default: latest] version of disco daemon to install

DESCRIPTION
  initializes a new server

EXAMPLES
  $ disco init root@12.34.56.78

  $ disco init root@12.34.56.78 --version 0.4.0
```

_See code: [src/commands/init.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/init.ts)_

## `disco invite:accept URL`

accept an invite to deploy to a server

```
USAGE
  $ disco invite:accept URL [--show-only]

ARGUMENTS
  URL  invite url

FLAGS
  --show-only  Show new API key only without updating CLI config

DESCRIPTION
  accept an invite to deploy to a server

EXAMPLES
  $ disco invite:accept https://mymachine.com/.disco/api-key-invites/8979ab987a9b879
```

_See code: [src/commands/invite/accept.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/invite/accept.ts)_

## `disco invite:create NAME`

invite someone to deploy to this server. server must have a dedicated domain name, see the meta:host command

```
USAGE
  $ disco invite:create NAME [--disco <value>]

ARGUMENTS
  NAME  api key invitee name

FLAGS
  --disco=<value>

DESCRIPTION
  invite someone to deploy to this server. server must have a dedicated domain name, see the meta:host command

EXAMPLES
  $ disco invite:create --disco mymachine.com zoe
```

_See code: [src/commands/invite/create.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/invite/create.ts)_

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

_See code: [src/commands/logs.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/logs.ts)_

## `disco meta:host DOMAIN`

set a host for the server

```
USAGE
  $ disco meta:host DOMAIN [--disco <value>]

FLAGS
  --disco=<value>

DESCRIPTION
  set a host for the server

EXAMPLES
  $ disco meta:host example.com
```

_See code: [src/commands/meta/host.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/meta/host.ts)_

## `disco meta:info`

fetch info about the server

```
USAGE
  $ disco meta:info [--disco <value>]

FLAGS
  --disco=<value>

DESCRIPTION
  fetch info about the server

EXAMPLES
  $ disco meta:info
```

_See code: [src/commands/meta/info.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/meta/info.ts)_

## `disco meta:upgrade`

upgrade server

```
USAGE
  $ disco meta:upgrade [--image <value>] [--dontPull] [--disco <value>]

FLAGS
  --disco=<value>
  --dontPull       don't pull the image before upgrading
  --image=<value>  the image to use. Defaults to letsdiscodev/daemon:latest

DESCRIPTION
  upgrade server

EXAMPLES
  $ disco meta:upgrade
```

_See code: [src/commands/meta/upgrade.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/meta/upgrade.ts)_

## `disco nodes:add SSHSTRING`

add a new server to your deployment

```
USAGE
  $ disco nodes:add SSHSTRING [--disco <value>] [--version <value>]

ARGUMENTS
  SSHSTRING  ssh user@IP to connect to new machine

FLAGS
  --disco=<value>
  --version=<value>  [default: latest]

DESCRIPTION
  add a new server to your deployment

EXAMPLES
  $ disco nodes:add root@12.34.56.78
```

_See code: [src/commands/nodes/add.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/nodes/add.ts)_

## `disco projects:add`

add a project

```
USAGE
  $ disco projects:add --name <value> [--domain <value>] [--github-repo <value>] [--disco <value>] [--deploy]

FLAGS
  --deploy               deploy the project after adding it
  --disco=<value>        server to use
  --domain=<value>       domain name where the app will be served, e.g. www.example.com
  --github-repo=<value>  URL used to clone the repo, e.g. git@github.com:example/example.git
  --name=<value>         (required) project name

DESCRIPTION
  add a project

EXAMPLES
  $ disco projects:add
```

_See code: [src/commands/projects/add.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/projects/add.ts)_

## `disco projects:list`

list projects

```
USAGE
  $ disco projects:list [--disco <value>]

FLAGS
  --disco=<value>

DESCRIPTION
  list projects

EXAMPLES
  $ disco projects:list
```

_See code: [src/commands/projects/list.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/projects/list.ts)_

## `disco projects:move`

move a project from one server to another

```
USAGE
  $ disco projects:move --project <value> --from-disco <value> --to-disco <value>

FLAGS
  --from-disco=<value>  (required) source disco server
  --project=<value>     (required) project name
  --to-disco=<value>    (required) destination disco server

DESCRIPTION
  move a project from one server to another

EXAMPLES
  $ disco projects:move --project mysite --from-disco 10.1.1.1 --to-disco 10.2.2.2
```

_See code: [src/commands/projects/move.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/projects/move.ts)_

## `disco projects:remove [PROJECT]`

remove a project

```
USAGE
  $ disco projects:remove [PROJECT] [--disco <value>]

ARGUMENTS
  PROJECT  project to remove

FLAGS
  --disco=<value>

DESCRIPTION
  remove a project

EXAMPLES
  $ disco projects:remove project-name
```

_See code: [src/commands/projects/remove.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/projects/remove.ts)_

## `disco run [COMMAND]`

remotely run a command

```
USAGE
  $ disco run [COMMAND] --project <value> [--service <value>] [--timeout <value>] [--disco <value>]

ARGUMENTS
  COMMAND  command to run

FLAGS
  --disco=<value>
  --project=<value>  (required)
  --service=<value>
  --timeout=<value>  [default: 600]

DESCRIPTION
  remotely run a command

EXAMPLES
  $ disco run --project mysite "python migrate.py"
```

_See code: [src/commands/run.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/run.ts)_

## `disco runcommand [PROJECT] [COMMAND] [ARGS]`

run a service-level (e.g. postgres) command

```
USAGE
  $ disco runcommand [PROJECT...] [COMMAND...] [ARGS...] [--timeout <value>] [--disco <value>]

ARGUMENTS
  PROJECT...  project to run command on
  COMMAND...  command to run
  ARGS...     args to pass to command

FLAGS
  --disco=<value>
  --timeout=<value>  [default: 600]

DESCRIPTION
  run a service-level (e.g. postgres) command

EXAMPLES
  $ disco runcommand postgres db:add -- "--project flask"
```

_See code: [src/commands/runcommand.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/runcommand.ts)_

## `disco scale SERVICES`

scale one or multiple services from a project

```
USAGE
  $ disco scale SERVICES... --project <value> [--disco <value>]

ARGUMENTS
  SERVICES...  service or services to scale and number of replicas, e.g. web=3

FLAGS
  --disco=<value>
  --project=<value>  (required)

DESCRIPTION
  scale one or multiple services from a project

EXAMPLES
  $ disco scale --project mysite web=1

  $ disco scale --project mysite web=3 worker=2
```

_See code: [src/commands/scale.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/scale.ts)_

## `disco syslog:add [SYSLOGDESTINATION]`

add a log destination

```
USAGE
  $ disco syslog:add [SYSLOGDESTINATION] [--disco <value>]

ARGUMENTS
  SYSLOGDESTINATION  syslog destination, should be syslog:// or syslog+tls:// protocol

FLAGS
  --disco=<value>

DESCRIPTION
  add a log destination

EXAMPLES
  $ disco syslog:add syslog://logs.example.com:4415

  $ disco syslog:add syslog+tls://logs.example.com:4415
```

_See code: [src/commands/syslog/add.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/syslog/add.ts)_

## `disco syslog:list`

see list of all log destinations

```
USAGE
  $ disco syslog:list [--disco <value>]

FLAGS
  --disco=<value>

DESCRIPTION
  see list of all log destinations

EXAMPLES
  $ disco syslog:list
```

_See code: [src/commands/syslog/list.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/syslog/list.ts)_

## `disco syslog:remove [SYSLOGDESTINATION]`

remove a log destination

```
USAGE
  $ disco syslog:remove [SYSLOGDESTINATION] [--disco <value>]

ARGUMENTS
  SYSLOGDESTINATION  syslog destination, should be syslog:// or syslog+tls:// protocol

FLAGS
  --disco=<value>

DESCRIPTION
  remove a log destination

EXAMPLES
  $ disco syslog:remove syslog://logs.example.com:4415

  $ disco syslog:remove syslog+tls://logs.example.com:4415
```

_See code: [src/commands/syslog/remove.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/syslog/remove.ts)_

## `disco volumes:export`

describe the command here

```
USAGE
  $ disco volumes:export --project <value> --volume <value> [--disco <value>]

FLAGS
  --disco=<value>
  --project=<value>  (required)
  --volume=<value>   (required)

DESCRIPTION
  describe the command here

EXAMPLES
  $ disco volumes:export
```

_See code: [src/commands/volumes/export.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/volumes/export.ts)_

## `disco volumes:import`

describe the command here

```
USAGE
  $ disco volumes:import --project <value> --volume <value> [--disco <value>]

FLAGS
  --disco=<value>
  --project=<value>  (required)
  --volume=<value>   (required)

DESCRIPTION
  describe the command here

EXAMPLES
  $ disco volumes:import
```

_See code: [src/commands/volumes/import.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/volumes/import.ts)_

## `disco volumes:list`

list all project's volumes

```
USAGE
  $ disco volumes:list --project <value> [--disco <value>]

FLAGS
  --disco=<value>
  --project=<value>  (required)

DESCRIPTION
  list all project's volumes

EXAMPLES
  $ disco volumes:list --project mysite
```

_See code: [src/commands/volumes/list.ts](https://github.com/letsdiscodev/cli/blob/v0.4.1/src/commands/volumes/list.ts)_
<!-- commandsstop -->
