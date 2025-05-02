#!/usr/bin/env bash
set -euo pipefail

ENV="dev"
BUNDLE="pacs-migration-pack"
NS="terrafusion"
INSTALLED=()

usage() {
  echo "Usage: $0 [--env <env>] [--bundle <id>] [--namespace <k8s-ns>]"
  exit 0
}

trap 'echo "⚠️  Error – rolling back"; for rel in "${INSTALLED[@]}"; do helm uninstall "$rel" -n "$NS"; done' ERR

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env) ENV="$2"; shift 2;;
    --bundle) BUNDLE="$2"; shift 2;;
    --namespace) NS="$2"; shift 2;;
    -h|--help) usage ;;
    *) echo "Unknown flag $1"; usage ;;
  esac
done

echo "🛠  Installing bundle $BUNDLE into namespace $NS (env=$ENV)"

kubectl get ns "$NS" >/dev/null 2>&1 || kubectl create ns "$NS"

TMP=$(mktemp -d)
curl -sSL "https://cdn.terrafusion.io/$BUNDLE/latest/terra.json" -o "$TMP/bundle.json"
COMPONENTS=$(jq -r '.contains[]' "$TMP/bundle.json")

for COMP in ${COMPONENTS}; do
  NAME=$(echo "$COMP" | cut -d'@' -f1)
  echo "🚀  Installing $NAME"
  CHART=$(curl -sSL "https://cdn.terrafusion.io/$NAME/latest/terra.json" | jq -r '.infra.helmChart')
  helm upgrade --install "$NAME" "$CHART" -n "$NS" --create-namespace --set global.environment="$ENV"
  INSTALLED+=("$NAME")
done

echo "✅  All components installed"
