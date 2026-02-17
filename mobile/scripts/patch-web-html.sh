#!/bin/bash
# Patch dist/index.html after `expo export --platform web`
# Adds dark background, viewport-fit, theme-color, PWA meta tags.

HTML="dist/index.html"
if [ ! -f "$HTML" ]; then
  echo "ERROR: $HTML not found. Run 'npx expo export --platform web' first."
  exit 1
fi

# 1. Dark background on body
sed -i '' 's|overflow: hidden;|overflow: hidden; background-color: #09090b;|' "$HTML"

# 2. viewport-fit=cover for safe areas on iOS
sed -i '' 's|shrink-to-fit=no|shrink-to-fit=no, viewport-fit=cover|' "$HTML"

# 3. theme-color + PWA meta tags (insert before <title>)
sed -i '' 's|<title>BudgetBot</title>|<meta name="theme-color" content="#09090b" /><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" /><meta name="apple-mobile-web-app-capable" content="yes" /><title>BudgetBot</title>|' "$HTML"

echo "Patched $HTML successfully."
