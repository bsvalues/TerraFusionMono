#!/usr/bin/env bash
set -euo pipefail

# This script tests the Import Wizard API endpoints locally or in a deployed environment

# Configuration
API_BASE_URL=${1:-"http://localhost:5000"}
TEST_FILE="temp/test-pacs-data.csv"

# Create test file if it doesn't exist
if [ ! -f "$TEST_FILE" ]; then
  echo "Creating test file: $TEST_FILE"
  mkdir -p temp
  cat > "$TEST_FILE" << EOF
Patient ID,Study Date,Modality,Description,Referring Physician
PAT001,2025-01-15,CT,Chest CT with contrast,Dr. Smith
PAT002,2025-01-16,MRI,Brain MRI without contrast,Dr. Johnson
PAT003,2025-01-17,XR,Chest X-ray PA and lateral,Dr. Williams
PAT004,2025-01-18,US,Abdominal ultrasound,Dr. Davis
PAT005,2025-01-19,CT,Abdominal CT with contrast,Dr. Miller
EOF
  echo "Test file created successfully"
fi

echo
echo "🧪 TerraFusion Import API Test Script"
echo "======================================"
echo

echo "⏳ Testing Import API status endpoint..."
RESPONSE=$(curl -s "$API_BASE_URL/api/import/test")
echo "$RESPONSE" | jq '.'

echo
echo "⏳ Testing file upload endpoint..."
UPLOAD_RESPONSE=$(curl -s -X POST -F "file=@$TEST_FILE" "$API_BASE_URL/api/import/pacs/upload")
echo "$UPLOAD_RESPONSE" | jq '.'

echo
echo "⏳ Testing data import endpoint..."
IMPORT_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"validationId": "test-validation-id"}' \
  "$API_BASE_URL/api/import/pacs/import")
echo "$IMPORT_RESPONSE" | jq '.'

echo
echo "✅ Import API Tests Completed"