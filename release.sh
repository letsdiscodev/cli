# exit on error
set -e
# print every command being run
set -x

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

# get the latest release pushed to the repo
# watch out as it has a 'v' at the beginning
latest_release=$(gh release list --limit 1 --json tagName --jq '.[0].tagName')

# get the version by cat'ing package.json into jq and extracting the version
version=$(cat package.json | jq -r '.version')

# check if the latest release is the same as the version in package.json
if [ "$latest_release" = "v$version" ]; then
  echo "The latest release is the same as the version in package.json. Please update the version in package.json before running this script"
  exit 1
fi

python -c "import os; print(os.environ['version'])"

#FIXME
#FIXME
#FIXME
#FIXME
exit 1

# ---

rm -rf dist
rm -rf tmp

npm ci

npm run build

oclif pack tarballs --no-xz

oclif upload tarballs --no-xz

# promote tarballs

# get the hash from calling python and passing -c "...some script"
hash=$(python3 -c "from pathlib import Path; print(str(list(Path('./dist').glob('disco-v0.5.5*'))[0]).split('-')[2])")

oclif promote --sha $hash --version $version --no-xz
