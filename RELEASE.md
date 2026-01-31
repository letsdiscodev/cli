### How to release

**Option 1: Auto-bump patch**
```bash
./release.sh
```
This will bump the patch version (e.g., v1.2.3 -> v1.2.4) and push the tag.

**Option 2: Specify version type**
```bash
./release.sh patch   # v1.2.3 -> v1.2.4
./release.sh minor   # v1.2.3 -> v1.3.0
./release.sh major   # v1.2.3 -> v2.0.0
```

**Option 3: Specify exact version**
```bash
./release.sh v1.5.0
```

**Option 4: Manual tag (for colleagues who prefer)**
```bash
git tag v1.5.0
git push origin v1.5.0
```

All options trigger the same GitHub Action which builds, uploads to S3, and invalidates CloudFront.

Watch progress at: https://github.com/letsdiscodev/cli/actions

### Required GitHub Secrets

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_CLOUDFRONT_DISTRIBUTION_ID`

### How to regenerate readme (CLI reference)

```bash
# gotta build first!
npm run build
npm run readme

# then, go to the docs.letsdisco.dev repo and git add push
```

NOTE: annoyingly, the words "import" and "export" cannot appear at the start of the lines, otherwise the mdx parser gets confused. manually replace them with " import" and " export"
