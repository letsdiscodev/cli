#!/bin/bash

# see RELEASE.md !!
# ---

# exit on error
set -e
# print every command being run
set -x

# curl + jq package.json to get version number from repo
# https://raw.githubusercontent.com/letsdiscodev/cli/main/package.json
# store version number in variable
version_from_repo=$(curl -s https://raw.githubusercontent.com/letsdiscodev/cli/main/package.json | jq -r '.version')
version_from_package=$(cat package.json | jq -r '.version')
# if the versions are the same, fail/exit/quit.
if [ "$version_from_repo" = "$version_from_package" ]; then
  echo "The version in package.json is the same as the version in the repo. Please update the version in package.json before running this script"
  exit 1
fi

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

if [ -z "${AWS_CLOUDFRONT_DISTRIBUTION_ID}" ]; then
  # fail
  echo "AWS_CLOUDFRONT_DISTRIBUTION_ID is not set Please set it before running this script"
  exit 1
fi

# get the latest release pushed to the repo
# watch out as it has a 'v' at the beginning
# latest_release=$(gh release list --limit 1 --json tagName --jq '.[0].tagName')

# get the version by cat'ing package.json into jq and extracting the version
version=$(cat package.json | jq -r '.version')

# check if the latest release is the same as the version in package.json
# don't use right now as this script is not running as part of the github release workflow
# if [ "$latest_release" = "v$version" ]; then
#   echo "The latest release is the same as the version in package.json. Please update the version in package.json before running this script"
#   exit 1
# fi


# ---

rm -rf dist
rm -rf tmp

npm ci

npm run build

oclif pack tarballs --no-xz

oclif upload tarballs --no-xz

# promote tarballs

# get the hash by calling python
hash=$(export PACKAGE_VERSION=$version && python3 -c "from pathlib import Path; import os; print(str(list(Path('./dist').glob('disco-v' + os.environ['PACKAGE_VERSION'] + '*'))[0]).split('-')[2])")

oclif promote --sha $hash --version $version --no-xz

aws cloudfront create-invalidation --distribution-id $AWS_CLOUDFRONT_DISTRIBUTION_ID --paths "/*"

echo "done"
echo ""
echo "***** * ** * * DONT FORGET TO GIT PUSH * * * ** * ******* *****"
echo ""
