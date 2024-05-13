set -e

# fail if git status shows changes not staged for commit
if [[ `git status --porcelain` ]]; then
  echo "There are changes not staged for commit. Please commit or stash them before running this script"
  exit 1
fi

if [ -z "${AWS_ACCESS_KEY_ID}" ]; then
  # fail
  echo "AWS_ACCESS_KEY_ID is not set Please set it before running this script"
  exit 1
fi

if [ -z "${AWS_SECRET_ACCESS_KEY}" ]; then
  # fail
  echo "AWS_SECRET_ACCESS_KEY is not set Please set it before running this script"
  exit 1
fi

rm -rf dist
rm -rf tmp

npm run ci

npm run build

oclif pack tarballs --parallel --no-xz

# TODO upload tarballs
# TODO promote tarballs -- extract hash somehow
