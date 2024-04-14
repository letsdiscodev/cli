```bash
# in repo
oclif pack tarballs --no-xz

AWS_ACCESS_KEY_ID="..." AWS_SECRET_ACCESS_KEY="..." oclif upload tarballs --no-xz

AWS_ACCESS_KEY_ID="..." AWS_SECRET_ACCESS_KEY="..." oclif promote --sha SHORTSHA --version VERSION --no-xz
```
