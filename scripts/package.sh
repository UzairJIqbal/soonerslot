#!/usr/bin/env bash
# Builds the zip uploaded to the Chrome Web Store: only the files the
# extension needs at runtime, nothing from docs/, tools/ or scripts/.
set -euo pipefail

cd "$(dirname "$0")/.."

version="$(node -p 'require("./manifest.json").version')"
out="dist/soonerslot-${version}.zip"

mkdir -p dist
rm -f "$out"
zip -qr "$out" \
	manifest.json background.js \
	lib popup offscreen sounds images data \
	-x '*.DS_Store'

echo "Packaged ${out} ($(du -h "$out" | cut -f1))"
