#!/usr/bin/env bash
set -euo pipefail

# All repos to pull in
repos=(
  TerraLegislativePulsePub
  TerraAgent
  TerraF
  TerraMiner
  TerraFusionPro
  TerraFusionSync
  TerraFlow
  BCBSCOSTApp
  BCBSGISPRO
  BCBSLevy
  BCBSWebhub
  BSBCmaster
  BSIncomeValuation
  GeoAssessmentPro
  BCBSGeoAssessmentPro
  BCBSDataEngine
  bcbspacsmapping
  terrafusion_mock-up
)

# Ensure we're in the monorepo root
if [ ! -f workspace.json ]; then
  echo "⚠️  Please run this from the TerraFusionMono repo root."
  exit 1
fi

# Create apps/ if missing
mkdir -p apps

# Loop: clone → move → strip .git → register
for repo in "${repos[@]}"; do
  name=$(echo "$repo" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
  target="apps/$name"

  echo "🔄 Importing $repo → $target"
  git clone "https://github.com/bsvalues/$repo.git" "temp-$repo"
  mv "temp-$repo" "$target"
  rm -rf "$target/.git"

  # Register in workspace.json
  jq --arg proj "$name" --arg path "$target" \
     '.projects[$proj] = { "root": $path, "sourceRoot": $path, "projectType": "application" }' \
     workspace.json > ws.tmp.json && mv ws.tmp.json workspace.json
done

# Install & format
npm install
npx prettier --write workspace.json

# Commit & push
git add .
git commit -m "chore: import all existing Terra* and BCBS* repos into monorepo"
git push

echo "✅ Import complete! Next: run 'nx serve <app-name>' to verify each, then wire them into your core-gateway or proxy."