### how to release

```bash
export $(cat .env | xargs) && ./release.sh
```

### how to regenerate readme i.e. cli reference

```bash
# gotta build first!
npm run build
npm run readme

# then, go to the docs.letsdisco.dev repo and git add push
```

NOTE: annoyingly, the words "import" and "export" cannot appear at the start of the lines, otherwise the mdx parser gets confused. manually replace them with " import" and " export"
