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
disco/0.5.3 darwin-arm64 node-v20.12.2
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
* [`disco domains:add DOMAIN`](#disco-domainsadd-domain)
* [`disco domains:list`](#disco-domainslist)
* [`disco domains:remove DOMAIN`](#disco-domainsremove-domain)
* [`disco env:get [ENVVAR]`](#disco-envget-envvar)
* [`disco env:list`](#disco-envlist)
* [`disco env:remove [ENVVAR]`](#disco-envremove-envvar)
* [`disco env:set [VARIABLES]`](#disco-envset-variables)
* [`disco github:apps:add`](#disco-githubappsadd)
* [`disco github:apps:list`](#disco-githubappslist)
* [`disco github:apps:manage OWNER`](#disco-githubappsmanage-owner)
* [`disco github:apps:prune`](#disco-githubappsprune)
* [`disco github:repos:list`](#disco-githubreposlist)
* [`disco help [COMMAND]`](#disco-help-command)
* [`disco init SSHSTRING`](#disco-init-sshstring)
* [`disco invite:accept URL`](#disco-inviteaccept-url)
* [`disco invite:create NAME`](#disco-invitecreate-name)
* [`disco logs`](#disco-logs)
* [`disco meta:host DOMAIN`](#disco-metahost-domain)
* [`disco meta:info`](#disco-metainfo)
* [`disco meta:upgrade`](#disco-metaupgrade)
* [`disco nodes:add SSHSTRING`](#disco-nodesadd-sshstring)
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
* [`disco projects:add`](#disco-projectsadd)
* [`disco projects:list`](#disco-projectslist)
* [`disco projects:move`](#disco-projectsmove)
* [`disco projects:remove PROJECT`](#disco-projectsremove-project)
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

_See code: [src/commands/apikeys/list.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/apikeys/list.ts)_

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

_See code: [src/commands/apikeys/remove.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/apikeys/remove.ts)_

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

_See code: [src/commands/deploy.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/deploy.ts)_

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

_See code: [src/commands/deploy/list.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/deploy/list.ts)_

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

_See code: [src/commands/deploy/output.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/deploy/output.ts)_

## `disco domains:add DOMAIN`

add a domain name to the project

```
USAGE
  $ disco domains:add DOMAIN --project <value> [--disco <value>]

ARGUMENTS
  DOMAIN  domain name

FLAGS
  --disco=<value>
  --project=<value>  (required)

DESCRIPTION
  add a domain name to the project

EXAMPLES
  $ disco domains:add www.example.com --project mysite
```

_See code: [src/commands/domains/add.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/domains/add.ts)_

## `disco domains:list`

list the domains

```
USAGE
  $ disco domains:list --project <value> [--disco <value>]

FLAGS
  --disco=<value>
  --project=<value>  (required)

DESCRIPTION
  list the domains

EXAMPLES
  $ disco domains:list --project mysite
```

_See code: [src/commands/domains/list.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/domains/list.ts)_

## `disco domains:remove DOMAIN`

remove the domain

```
USAGE
  $ disco domains:remove DOMAIN --project <value> [--disco <value>]

ARGUMENTS
  DOMAIN  domain to remove

FLAGS
  --disco=<value>
  --project=<value>  (required)

DESCRIPTION
  remove the domain

EXAMPLES
  $ disco domains:remove www.example.com --project mysite
```

_See code: [src/commands/domains/remove.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/domains/remove.ts)_

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

_See code: [src/commands/env/get.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/env/get.ts)_

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

_See code: [src/commands/env/list.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/env/list.ts)_

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

_See code: [src/commands/env/remove.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/env/remove.ts)_

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

_See code: [src/commands/env/set.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/env/set.ts)_

## `disco github:apps:add`

add a Github app

```
USAGE
  $ disco github:apps:add [--organization <value>] [--disco <value>]

FLAGS
  --disco=<value>
  --organization=<value>

DESCRIPTION
  add a Github app

EXAMPLES
  $ disco github:apps:add
```

_See code: [src/commands/github/apps/add.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/github/apps/add.ts)_

## `disco github:apps:list`

list Github apps

```
USAGE
  $ disco github:apps:list [--disco <value>]

FLAGS
  --disco=<value>

DESCRIPTION
  list Github apps

EXAMPLES
  $ disco github:apps:list
```

_See code: [src/commands/github/apps/list.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/github/apps/list.ts)_

## `disco github:apps:manage OWNER`

manage Github app

```
USAGE
  $ disco github:apps:manage OWNER [--disco <value>]

ARGUMENTS
  OWNER  the user or org name from Github

FLAGS
  --disco=<value>

DESCRIPTION
  manage Github app

EXAMPLES
  $ disco github:apps:manage
```

_See code: [src/commands/github/apps/manage.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/github/apps/manage.ts)_

## `disco github:apps:prune`

prune Github apps

```
USAGE
  $ disco github:apps:prune [--disco <value>]

FLAGS
  --disco=<value>

DESCRIPTION
  prune Github apps

EXAMPLES
  $ disco github:apps:prune
```

_See code: [src/commands/github/apps/prune.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/github/apps/prune.ts)_

## `disco github:repos:list`

list Github repos accessible thoughs Github Apps

```
USAGE
  $ disco github:repos:list [--disco <value>]

FLAGS
  --disco=<value>

DESCRIPTION
  list Github repos accessible thoughs Github Apps

EXAMPLES
  $ disco github:repos:list
```

_See code: [src/commands/github/repos/list.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/github/repos/list.ts)_

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

## `disco init SSHSTRING`

initializes a new server

```
USAGE
  $ disco init SSHSTRING [--version <value>] [--verbose] [--host <value>] [--local-image <value>]
    [--advertise-addr <value>]

FLAGS
  --advertise-addr=<value>  fixed IP address used to add nodes. defaults to resolving domain name of ssh connection
  --host=<value>            hostname to use, when installing using an internal IP for the SSH connection, e.g. disco
                            init root@10.1.2.3 --host disco.example.com
  --local-image=<value>     local Docker image to upload and use (mostly for Disco development)
  --verbose                 show extra output
  --version=<value>         [default: latest] version of disco daemon to install

DESCRIPTION
  initializes a new server

EXAMPLES
  $ disco init root@disco.example.com

  $ disco init root@disco.example.com --version 0.4.0
```

_See code: [src/commands/init.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/init.ts)_

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
  $ disco invite:accept https://mymachine.com/api-key-invites/8979ab987a9b879
```

_See code: [src/commands/invite/accept.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/invite/accept.ts)_

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

_See code: [src/commands/invite/create.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/invite/create.ts)_

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

_See code: [src/commands/logs.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/logs.ts)_

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

_See code: [src/commands/meta/host.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/meta/host.ts)_

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

_See code: [src/commands/meta/info.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/meta/info.ts)_

## `disco meta:upgrade`

upgrade server

```
USAGE
  $ disco meta:upgrade [--image <value>] [--dont-pull] [--disco <value>]

FLAGS
  --disco=<value>
  --dont-pull      don't pull the image before upgrading
  --image=<value>  the image to use. Defaults to letsdiscodev/daemon:latest

DESCRIPTION
  upgrade server

EXAMPLES
  $ disco meta:upgrade
```

_See code: [src/commands/meta/upgrade.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/meta/upgrade.ts)_

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

_See code: [src/commands/nodes/add.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/nodes/add.ts)_

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

  Uses bundled npm executable to install plugins into /Users/g/.local/share/disco

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

  Uses bundled npm executable to install plugins into /Users/g/.local/share/disco

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

## `disco projects:add`

add a project

```
USAGE
  $ disco projects:add --name <value> [--domain <value>] [--github <value>] [--disco <value>]

FLAGS
  --disco=<value>   server to use
  --domain=<value>  domain name where the app will be served, e.g. www.example.com
  --github=<value>  full name of the Github repository, including user or organization and repository name, e.g.
                    myuser/myproject
  --name=<value>    (required) project name

DESCRIPTION
  add a project

EXAMPLES
  $ disco projects:add
```

_See code: [src/commands/projects/add.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/projects/add.ts)_

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

_See code: [src/commands/projects/list.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/projects/list.ts)_

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

_See code: [src/commands/projects/move.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/projects/move.ts)_

## `disco projects:remove PROJECT`

remove a project

```
USAGE
  $ disco projects:remove PROJECT [--disco <value>]

ARGUMENTS
  PROJECT  project to remove

FLAGS
  --disco=<value>

DESCRIPTION
  remove a project

EXAMPLES
  $ disco projects:remove project-name
```

_See code: [src/commands/projects/remove.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/projects/remove.ts)_

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

_See code: [src/commands/run.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/run.ts)_

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

_See code: [src/commands/runcommand.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/runcommand.ts)_

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

_See code: [src/commands/scale.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/scale.ts)_

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

_See code: [src/commands/syslog/add.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/syslog/add.ts)_

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

_See code: [src/commands/syslog/list.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/syslog/list.ts)_

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

_See code: [src/commands/syslog/remove.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/syslog/remove.ts)_

## `disco volumes:export`

TODO describe the command here

```
USAGE
  $ disco volumes:export --project <value> --volume <value> [--disco <value>]

FLAGS
  --disco=<value>
  --project=<value>  (required)
  --volume=<value>   (required)

DESCRIPTION
  TODO describe the command here

EXAMPLES
  $ disco volumes:export
```

_See code: [src/commands/volumes/export.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/volumes/export.ts)_

## `disco volumes:import`

TODO describe the command here

```
USAGE
  $ disco volumes:import --project <value> --volume <value> [--disco <value>]

FLAGS
  --disco=<value>
  --project=<value>  (required)
  --volume=<value>   (required)

DESCRIPTION
  TODO describe the command here

EXAMPLES
  $ disco volumes:import
```

_See code: [src/commands/volumes/import.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/volumes/import.ts)_

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

_See code: [src/commands/volumes/list.ts](https://github.com/letsdiscodev/cli/blob/v0.5.3/src/commands/volumes/list.ts)_
<!-- commandsstop -->
