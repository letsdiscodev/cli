#!/bin/bash

# Creates and pushes a version tag to trigger the release workflow.
#
# Usage:
#   ./release.sh           # auto-bump patch (v1.2.3 -> v1.2.4)
#   ./release.sh v1.3.0    # use specific version
#   ./release.sh minor     # bump minor (v1.2.3 -> v1.3.0)
#   ./release.sh major     # bump major (v1.2.3 -> v2.0.0)

set -e

# Get the latest tag
latest_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
latest_version="${latest_tag#v}"

# Parse version components
IFS='.' read -r major minor patch <<< "$latest_version"

# Determine the new version
if [ -n "$1" ]; then
  case "$1" in
    major)
      new_version="$((major + 1)).0.0"
      ;;
    minor)
      new_version="${major}.$((minor + 1)).0"
      ;;
    patch)
      new_version="${major}.${minor}.$((patch + 1))"
      ;;
    v*)
      new_version="${1#v}"
      ;;
    *)
      new_version="$1"
      ;;
  esac
else
  # Default: check package.json, use it if higher, otherwise bump patch
  package_version=$(node -p "require('./package.json').version")

  # Compare versions (simple string compare works for semver)
  if [ "$(printf '%s\n' "$latest_version" "$package_version" | sort -V | tail -n1)" = "$package_version" ] && [ "$package_version" != "$latest_version" ]; then
    new_version="$package_version"
    echo "Using version from package.json: $new_version"
  else
    new_version="${major}.${minor}.$((patch + 1))"
    echo "Auto-bumping patch: $latest_version -> $new_version"
  fi
fi

new_tag="v$new_version"

# Check if tag already exists
if git rev-parse "$new_tag" >/dev/null 2>&1; then
  echo "Error: Tag $new_tag already exists"
  exit 1
fi

# Confirm with user
echo ""
echo "This will create and push tag: $new_tag"
echo "GitHub Actions will then build and release."
read -p "Continue? [y/N] " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

# Create and push the tag
git tag "$new_tag"
git push origin "$new_tag"

echo ""
echo "Tag $new_tag pushed. GitHub Actions will handle the release."
echo "Watch progress at: https://github.com/letsdiscodev/cli/actions"
