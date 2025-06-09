#!/usr/bin/env bash
set -euo pipefail

CLUSTER_NAMESPACE=${1:-default}
GATEWAY_RELEASE=api-gateway
WIZARD_RELEASE=valuation-wizard

echo
echo "⏳ Verifying Helm releases in namespace › $CLUSTER_NAMESPACE"
helm ls -n $CLUSTER_NAMESPACE | grep -E "$GATEWAY_RELEASE|$WIZARD_RELEASE"

echo
echo "⏳ Checking Kubernetes Services"
kubectl get svc -n $CLUSTER_NAMESPACE -l "app in ($GATEWAY_RELEASE,$WIZARD_RELEASE)" -o wide

echo
echo "⏳ Checking Pods status"
kubectl get pods -n $CLUSTER_NAMESPACE -l "app in ($GATEWAY_RELEASE,$WIZARD_RELEASE)" 

echo
echo "⏳ Testing health endpoints"
GATEWAY_SVC=$(kubectl get svc $GATEWAY_RELEASE -n $CLUSTER_NAMESPACE -o jsonpath='{.spec.clusterIP}')
WIZARD_SVC=$(kubectl get svc $WIZARD_RELEASE -n $CLUSTER_NAMESPACE -o jsonpath='{.spec.clusterIP}')
echo " - API Gateway health: " 
curl -fsS http://$GATEWAY_SVC:8000/health && echo "OK"
echo " - Wizard UI load (root):"
curl -fsS http://$WIZARD_SVC:3000/ | head -n1

echo
echo "⏳ Testing metrics endpoints"
echo " - API Gateway /metrics:"
curl -fsS http://$GATEWAY_SVC:8000/metrics | head -n5
echo " - Wizard /metrics:"
curl -fsS http://$WIZARD_SVC:3000/metrics | head -n5

echo
echo "⏳ Testing Import Wizard API endpoints"
echo " - Import API test endpoint:"
curl -fsS http://$GATEWAY_SVC:8000/api/import/test
echo
echo " - Import upload endpoint (sample test):"
curl -X POST -F "file=@../temp/test-pacs-data.csv" http://$GATEWAY_SVC:8000/api/import/pacs/upload | head -n5
echo "..."

echo
echo "⏳ Validating Prometheus scraping targets:"
# If kubectl port-forward is active:
if curl -s http://localhost:9090/api/v1/targets &>/dev/null; then
  echo " - Checking 'valuation-wizard' target:"
  curl -s 'http://localhost:9090/api/v1/targets' | jq '.data.activeTargets[] | select(.labels.job=="valuation-wizard")'
else
  echo " - Prometheus not accessible via localhost:9090. Consider running:"
  echo "   kubectl port-forward svc/prometheus-operated 9090"
fi

echo
echo "⏳ Checking Alert Rules:"
# If kubectl port-forward is active:
if curl -s http://localhost:9090/api/v1/rules &>/dev/null; then
  echo " - Listing active alert rules:"
  curl -s 'http://localhost:9090/api/v1/rules' | jq '.data.groups[].rules[] | select(.name=="HighRequestLatency" or .name=="HighErrorRate" or .name=="E2ETestFailures")'
else
  echo " - Prometheus alerts not accessible. Consider running:"
  echo "   kubectl port-forward svc/prometheus-operated 9090"
fi

echo
echo "✅ All TerraFusion components appear deployed and healthy."