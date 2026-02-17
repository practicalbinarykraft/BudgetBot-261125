#!/usr/bin/env bash
# patch-web-html.sh — post-export patch for Expo Web index.html
# Adds dark background, viewport-fit=cover, and theme-color meta tags
# to prevent white flash and white bars on mobile browsers.
#
# Usage: ./scripts/patch-web-html.sh [dist-dir]
#   dist-dir defaults to ./dist

set -euo pipefail

DIST="${1:-dist}"
INDEX="$DIST/index.html"

if [ ! -f "$INDEX" ]; then
  echo "ERROR: $INDEX not found. Run 'npx expo export --platform web' first."
  exit 1
fi

echo "Patching $INDEX..."

# 1. Add dark background to <body> (prevents white flash)
sed -i.bak 's|<body[^>]*>|<body style="background-color:#09090b">|' "$INDEX"

# 2. Add viewport-fit=cover to existing viewport meta
sed -i.bak 's|content="width=device-width,initial-scale=1"|content="width=device-width,initial-scale=1,viewport-fit=cover"|' "$INDEX"

# 3. Add theme-color meta tags after <head>
sed -i.bak 's|<head>|<head>\n<meta name="theme-color" content="#09090b" media="(prefers-color-scheme: dark)">\n<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">|' "$INDEX"

# Clean up backup files
rm -f "$INDEX.bak"

echo "Done. Patched: dark background, viewport-fit=cover, theme-color."
