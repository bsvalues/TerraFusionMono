#!/usr/bin/env bash
# ------------------------------------------------------------------
# TerraFusion – PACS Migration Pack bootstrap helper
# ------------------------------------------------------------------
# Usage:
#   ./scripts/pacs_wizard.sh --env dev \
#       --bundle pacs-migration-pack \
#       --namespace terrafusion
#
# Prereqs:
#   • kubectl + context pointing at your cluster
#   • helm v3
#   • yq (≥4.x) for simple YAML munging
# ------------------------------------------------------------------

set -euo pipefail

# ---------- CLI parsing -------------------------------------------------------
ENV="dev"
BUNDLE="pacs-migration-pack"
NS="terrafusion"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)        ENV="$2";       shift 2;;
    --bundle)     BUNDLE="$2";    shift 2;;
    --namespace)  NS="$2";        shift 2;;
    -h|--help)
      grep '^# ' "$0" | sed 's/^# //' ; exit 0 ;;
    *) echo "Unknown flag $1"; exit 1;;
  esac
done

echo "🛠  Bootstrapping '${BUNDLE}' into namespace '${NS}' (env=${ENV})"

# ---------- Namespace ---------------------------------------------------------
kubectl get ns "${NS}" >/dev/null 2>&1 || kubectl create ns "${NS}"

# ---------- Pull & unpack bundle metadata ------------------------------------
TMP=$(mktemp -d)
echo "⬇️  Fetching bundle metadata…"
curl -sSL "https://cdn.terrafusion.io/${BUNDLE}/latest/terra.json" -o "${TMP}/bundle.json"

COMPONENTS=$(jq -r '.contains[]' "${TMP}/bundle.json")

# ---------- Iterate each component & helm install -----------------------------
for COMP in ${COMPONENTS}; do
  NAME=$(echo "${COMP}" | cut -d'@' -f1)
  echo "🚀  Installing component: ${NAME}"
  CHART_URL=$(curl -sSL "https://cdn.terrafusion.io/${NAME}/latest/terra.json" | jq -r '.infra.helmChart')
  helm upgrade --install "${NAME}" "${CHART_URL}" \
       --namespace "${NS}" --create-namespace \
       --set global.environment="${ENV}"
done

echo "✅  PACS Migration Pack bootstrap complete"
