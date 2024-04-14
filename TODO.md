- pack tarballs
- test tarball on mac, ubuntu, fedora?
- upload, promote
- try releasing .exe? try it?
- update documentation re: tarballs & supported OS
- work on homepage!
- update docs / examples to make sure they're compatible with new cli

---

- salesforces does pkg, .exe and linux tarball directly
  - no curl, no brew
- change oclif-hello-world in the readme, point to docs
- follow what heroku does for run --- and also apply it to runcommand (bring it the heroku run plugin, call buildCommand, etc.) -- update examples to do that
- should we use heroku's install.sh? install-ubuntu.sh? yes.
- archive disco-cli
- point to cli repo
- update docs - point to tarballs
  - update docs on `command` with --
- move stuff from readme into reference.md
- also copy readme aka reference.md into docs
- retest tarballs - ubuntu, fedora, other linux, macos

- tarball installation on linux: follow these instructions https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_install_cli.htm#sfdx_setup_install_cli_linux

- check update plugin
- windows how to make .exe
- rewrite disco-cli
  - syslog_add -- problem with daemon..?
  - syslog_remove -- problem with daemon..?
- use oclif ui module for color (already started with projects:add)
- env:get should output actual env var as stdout and human readable int as stderr
  - maybe look into the json output - would that do the right stdout/err thing?
- in volumes:import sanity check that file is tar gz?
- add tests -- mock network requests
- look into autocomplete
- add command to call oclif upload with `AWS_...` vars from .env
- try auto update plugin? add it / try it / run promote on new version
- try on mac?
- try on ubuntu / hetzner?
- build for macos, ubuntu
- connect with homebrew?
- ubuntu installation instructions?
- look into upgrade plugin
- test upgrade on macos, ubuntu (+fedora + other OSs on hetzner/DO), windows (use parallels)
- look into https://github.com/oclif/plugin-warn-if-update-available
- once cutover, archive disco-cli, point to /cli
- update docs re: installing/upgrading
- use `npm run version` - but copy/paste into docs // generate CLI.md or something instead of readme? and don't git add readme
- set the version (something that's +0.1 more than current homebrew? in line with the python cli version?)
- disable 'plugins'..? i.e. ability to have/add plugins? (and see them in binary's help)
- look into what s3 tarballs upload does (only uploads?) - would prefer to push to releases on github
- enable workflows:
  - when adding tag - build tarballs + make those part of releases? (i.e. tag -> build tarball -> release with files)
  - test on every push
- add some tests to commands
- run tests as part of release process
- command that expect a server (env list, many others) should check first if there's a .disco config at all -- use a parent class for all commands that take / expect a --disco param?
  - should read auth from config call be a oclif hook..? or just utility func called every time? or a parent class to all commands that require auth?
  - https://oclif.io/docs/base_class/ for --disco ? and different one for cli commands expecting disco and project? and call getDisco automatically to set this.discoConfig? or overkill?
- move pattern of calling readEventSource and printing json.parse().text using process.stdout.write into function
- centralize running ssh command code from init.ts and nodes:add
- for the future: see list of nodes and see list of scaled servers
- maybe on webhook ping, try to do a deployment..? but deploy key might not have been set ... but also CLI could walk you through steps and ask you to add deploy key first AND THEN webhook... AND THEN deploy...!
- migrate to esm version -- at some point?
- release 0.4.1 with latest updates to CLI

---

ask Rodrigo:

- probably not needed anymore....!!!
  - how to patch oclif re: tarball bundling which requires the yarn patch?
  - FIND PERMANENT FIX for yarn --- right now, running `npm run pack` requires manual hack explained here -- https://github.com/oclif/oclif/issues/759#issuecomment-1516581856 -- i.e. need to manually change lib/tarballs/build.js to have different `yarn workspaces ......` line
    - it seems to work now.......!!!
