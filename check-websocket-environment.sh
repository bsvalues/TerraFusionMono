#!/bin/bash
# Script to check WebSocket connectivity environment and issues

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}TerraFusionMono WebSocket Environment Check${NC}"
echo

# Function to check if a command exists
function command_exists() {
  command -v "$1" &> /dev/null
}

# Check for curl
if ! command_exists curl; then
  echo -e "${RED}Error: curl is not installed${NC}"
  echo "Please install curl to run this check"
  exit 1
fi

# Function to print section header
function print_section() {
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}$(printf '=%.0s' $(seq 1 ${#1}))${NC}"
}

# Function to print test result
function print_result() {
  local test_name=$1
  local result=$2
  local details=$3
  
  if [ "$result" == "pass" ]; then
    echo -e "${GREEN}✓ $test_name${NC}"
  elif [ "$result" == "warn" ]; then
    echo -e "${YELLOW}⚠ $test_name${NC}"
  else
    echo -e "${RED}✗ $test_name${NC}"
  fi
  
  if [ -n "$details" ]; then
    echo "  $details"
  fi
}

# Environment information
print_section "Environment Information"

# Check if we're in Replit
if [ -n "$REPL_ID" ] && [ -n "$REPL_SLUG" ]; then
  echo -e "Running in: ${GREEN}Replit Environment${NC}"
  echo -e "Repl ID: ${YELLOW}$REPL_ID${NC}"
  echo -e "Repl Slug: ${YELLOW}$REPL_SLUG${NC}"
  echo -e "Repl Owner: ${YELLOW}$REPL_OWNER${NC}"
  
  # Check for Janeway/AI environment
  if [ "$REPLIT_ENVIRONMENT" == "janeway" ] || [ "$REPLIT_ENVIRONMENT" == "ai" ]; then
    echo -e "Environment Type: ${YELLOW}Janeway/AI Agent${NC}"
    echo -e "Deployment ID: ${YELLOW}$REPLIT_DEPLOYMENT_ID${NC}"
    IS_JANEWAY=true
  else
    echo -e "Environment Type: ${GREEN}Standard Replit${NC}"
    IS_JANEWAY=false
  fi
  
  IS_REPLIT=true
else
  echo -e "Running in: ${BLUE}Local Environment${NC}"
  IS_REPLIT=false
  IS_JANEWAY=false
fi

echo

# Network configuration
print_section "Network Configuration"

# Get hostname and check DNS
HOSTNAME=$(hostname)
echo -e "Hostname: ${YELLOW}$HOSTNAME${NC}"

if [ "$IS_REPLIT" = true ]; then
  EXPECTED_URL="https://$REPL_SLUG.$REPL_OWNER.repl.co"
  
  if [ "$IS_JANEWAY" = true ] && [ -n "$REPLIT_DEPLOYMENT_ID" ]; then
    EXPECTED_URL="https://$REPLIT_DEPLOYMENT_ID-00-$REPL_SLUG.$REPL_OWNER.repl.co"
  fi
  
  echo -e "Expected URL: ${YELLOW}$EXPECTED_URL${NC}"
  
  # Check if we can resolve the domain
  if host $REPL_SLUG.$REPL_OWNER.repl.co &> /dev/null; then
    print_result "Domain Resolution" "pass" "Domain resolves correctly"
  else
    print_result "Domain Resolution" "fail" "Cannot resolve domain $REPL_SLUG.$REPL_OWNER.repl.co"
  fi
else
  echo -e "Expected URL: ${YELLOW}http://localhost:3000${NC} (local development)"
fi

echo

# WebSocket connectivity
print_section "WebSocket Connectivity"

# Define test endpoints
WS_TEST_ENDPOINTS=(
  "ws://localhost:3000"
  "wss://localhost:3000"
)

if [ "$IS_REPLIT" = true ]; then
  WS_TEST_ENDPOINTS+=(
    "ws://$REPL_SLUG.$REPL_OWNER.repl.co"
    "wss://$REPL_SLUG.$REPL_OWNER.repl.co"
  )
  
  if [ "$IS_JANEWAY" = true ] && [ -n "$REPLIT_DEPLOYMENT_ID" ]; then
    WS_TEST_ENDPOINTS+=(
      "ws://$REPLIT_DEPLOYMENT_ID-00-$REPL_SLUG.$REPL_OWNER.repl.co"
      "wss://$REPLIT_DEPLOYMENT_ID-00-$REPL_SLUG.$REPL_OWNER.repl.co"
    )
  fi
fi

# Check if we have a WebSocket testing tool
if command_exists wscat; then
  WS_TOOL="wscat"
elif command_exists websocat; then
  WS_TOOL="websocat"
else
  print_result "WebSocket Testing" "warn" "No WebSocket client tool found (wscat or websocat)"
  echo "Consider installing a WebSocket client tool for better testing"
  WS_TOOL="none"
fi

# Basic connectivity check using curl
for endpoint in "${WS_TEST_ENDPOINTS[@]}"; do
  http_endpoint="${endpoint/ws:/http:}"
  http_endpoint="${http_endpoint/wss:/https:}"
  
  # Try to connect with curl
  if curl -s --max-time 2 "$http_endpoint" &> /dev/null; then
    print_result "HTTP Connectivity to $http_endpoint" "pass" "HTTP connection successful"
  else
    print_result "HTTP Connectivity to $http_endpoint" "fail" "Cannot connect via HTTP"
  fi
  
  # Try WebSocket if we have a tool
  if [ "$WS_TOOL" != "none" ]; then
    if [ "$WS_TOOL" = "wscat" ]; then
      if wscat -c "$endpoint" --connect-timeout 2 &> /dev/null; then
        print_result "WebSocket Connectivity to $endpoint" "pass" "WebSocket connection successful"
      else
        print_result "WebSocket Connectivity to $endpoint" "fail" "Cannot connect via WebSocket"
      fi
    elif [ "$WS_TOOL" = "websocat" ]; then
      if websocat "$endpoint" -t 2 &> /dev/null; then
        print_result "WebSocket Connectivity to $endpoint" "pass" "WebSocket connection successful"
      else
        print_result "WebSocket Connectivity to $endpoint" "fail" "Cannot connect via WebSocket"
      fi
    fi
  fi
done

echo

# WebSocket fixes check
print_section "WebSocket Fixes Status"

# Check for fix scripts
WS_FIX_FILES=(
  "public/vite-hmr-fix.js"
  "public/improved-vite-hmr-fix.js"
  "public/janeway-vite-hmr-fix.js"
  "public/janeway-direct-fix.js"
  "public/vite-hmr-launcher.js"
)

for file in "${WS_FIX_FILES[@]}"; do
  if [ -f "$file" ]; then
    print_result "Fix Script: $file" "pass" "Script exists"
  else
    print_result "Fix Script: $file" "fail" "Script not found"
  fi
done

# Check for plugin scripts
WS_PLUGIN_FILES=(
  "vite-hmr-fix-plugin.js"
  "enhanced-vite-hmr-fix-plugin.js"
  "janeway-vite-plugin.js"
)

for file in "${WS_PLUGIN_FILES[@]}"; do
  if [ -f "$file" ]; then
    print_result "Plugin Script: $file" "pass" "Plugin exists"
  else
    print_result "Plugin Script: $file" "fail" "Plugin not found"
  fi
done

# Check index.html files for fix inclusion
echo
echo -e "${BLUE}Checking for fix script inclusion in HTML files:${NC}"
echo

# Find all index.html files
INDEX_FILES=$(find . -name "index.html" 2>/dev/null)

for file in $INDEX_FILES; do
  echo -e "File: ${YELLOW}$file${NC}"
  
  if grep -q "vite-hmr-launcher.js" "$file"; then
    print_result "Launcher Script" "pass" "Using launcher script"
  elif grep -q "improved-vite-hmr-fix.js" "$file"; then
    print_result "Improved Fix" "pass" "Using improved fix"
  elif grep -q "janeway-vite-hmr-fix.js" "$file"; then
    print_result "Janeway Fix" "pass" "Using Janeway fix"
  elif grep -q "vite-hmr-fix.js" "$file"; then
    print_result "Basic Fix" "pass" "Using basic fix"
  else
    print_result "WebSocket Fix" "fail" "No WebSocket fix script found"
    
    # Check if this is a Vite app
    if grep -q "script type=\"module\"" "$file"; then
      echo -e "${YELLOW}This appears to be a Vite application without WebSocket fix${NC}"
      echo -e "Consider adding the fix with: ./apply-websocket-fix.sh"
    fi
  fi
  
  echo
done

# Recommendations
print_section "Recommendations"

if [ "$IS_JANEWAY" = true ]; then
  echo -e "${YELLOW}You are running in Janeway environment:${NC}"
  echo -e "1. Use ${GREEN}janeway-direct-fix.js${NC} for most aggressive WebSocket fix"
  echo -e "2. Apply fix with: ${GREEN}./convert-to-launcher.sh${NC}"
  echo -e "3. For manual fix, add: ${GREEN}<script src=\"/vite-hmr-launcher.js\"></script>${NC} to HTML files"
elif [ "$IS_REPLIT" = true ]; then
  echo -e "${YELLOW}You are running in standard Replit environment:${NC}"
  echo -e "1. Use ${GREEN}improved-vite-hmr-fix.js${NC} for best compatibility"
  echo -e "2. Apply fix with: ${GREEN}./convert-to-launcher.sh${NC}"
  echo -e "3. For manual fix, add: ${GREEN}<script src=\"/vite-hmr-launcher.js\"></script>${NC} to HTML files"
else
  echo -e "${YELLOW}You are running in local development environment:${NC}"
  echo -e "1. WebSocket fixes are not typically needed for local development"
  echo -e "2. Be aware that WebSocket behavior may differ when deployed to Replit"
fi

echo
echo -e "${GREEN}Environment check complete!${NC}"