#!/usr/bin/env bash
# Build and publish dist/ to the gh-pages branch (GitHub Pages).
set -euo pipefail
cd "$(dirname "$0")/.."

bun run build
cd dist
git init -q -b gh-pages
git add -A
git commit -q -m "deploy $(date +%Y-%m-%d_%H:%M)"
git push -f "https://github.com/yichengsun/zen-sound-sim.git" gh-pages
cd ..
rm -rf dist/.git
echo "deployed → https://yichengsun.github.io/zen-sound-sim/"
