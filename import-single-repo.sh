#!/usr/bin/env bash
set -euo pipefail

# Clean up any temp directories that might be left over
rm -rf temp-*

# Repository to import
if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <repository-name>"
  exit 1
fi

repo=$1

# Ensure we're in the monorepo root
if [ ! -f workspace.json ]; then
  echo "⚠️  Please run this from the TerraFusionMono repo root."
  exit 1
fi

# Create apps/ if missing
mkdir -p apps

# Process: clone → move → strip .git → register
echo "------------------------------------"
name=$(echo "$repo" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
target="apps/$name"

# Skip if already imported
if [ -d "$target" ]; then
  echo "⏩ Skipping $repo - already imported to $target"
  exit 0
fi

echo "🔄 Importing $repo → $target"
git clone "https://github.com/bsvalues/$repo.git" "temp-$repo"
mv "temp-$repo" "$target"
rm -rf "$target/.git"

# Register the new project in workspace.json using a manual approach
echo "📝 Registering $name in workspace.json"
ENTRY="    \"$name\": \"$target\","

# Insert the new entry before the closing brace
TEMP_FILE="workspace.tmp.json"
awk -v entry="$ENTRY" '
/^  }/ { print entry; }
{ print }
' workspace.json > $TEMP_FILE
mv $TEMP_FILE workspace.json

echo "✅ Imported $repo successfully!"