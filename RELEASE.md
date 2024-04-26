- make sure to update version in package.json

```bash
# in repo
oclif pack tarballs --no-xz --parallel

AWS_ACCESS_KEY_ID="..." AWS_SECRET_ACCESS_KEY="..." oclif upload tarballs --no-xz

AWS_ACCESS_KEY_ID="..." AWS_SECRET_ACCESS_KEY="..." oclif promote --sha SHORTSHA --version VERSION --no-xz
```

- add a new release - https://github.com/letsdiscodev/cli/releases/new
  - version should be in `v0.4.1` format
