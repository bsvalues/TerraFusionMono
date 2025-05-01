#!/bin/bash
# TerraFusion Federation Gateway Launcher
# This script starts the Apollo Federation Gateway and checks the status of all subgraphs

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to display a section header
section() {
  echo -e "\n${BOLD}${BLUE}== $1 ==${NC}\n"
}

# Function to display a success message
success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to display a warning message
warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to display an error message
error() {
  echo -e "${RED}✗ $1${NC}"
}

# Function to display info
info() {
  echo -e "${CYAN}ℹ $1${NC}"
}

# Print banner
echo -e "${BOLD}${BLUE}"
echo "╔════════════════════════════════════════════════════╗"
echo "║                                                    ║"
echo "║             TerraFusion Federation Gateway         ║"
echo "║                                                    ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if the gateway directory exists
section "Checking Gateway Files"

if [ ! -d "apps/core-gateway" ]; then
  error "Gateway directory not found!"
  warning "Make sure you're running this script from the repository root directory."
  exit 1
else
  success "Gateway directory found"
fi

# Make sure node is installed
if ! command -v node &> /dev/null; then
  error "Node.js is not installed or not in PATH"
  exit 1
else
  NODE_VERSION=$(node -v)
  success "Node.js is installed: $NODE_VERSION"
fi

# Check TypeScript support
if ! command -v npx tsx &> /dev/null; then
  warning "tsx is not directly available, will use npx"
  TSX_CMD="npx tsx"
else
  success "tsx is available for TypeScript execution"
  TSX_CMD="tsx"
fi

# Check if the config file exists
CONFIG_PATH="apps/core-gateway/src/graphql/subgraphs.config.json"

if [ ! -f "$CONFIG_PATH" ]; then
  warning "Gateway configuration file not found! Creating default configuration..."
  mkdir -p apps/core-gateway/src/graphql
  cat > "$CONFIG_PATH" << EOF
{
  "subgraphs": [
    {
      "name": "terraagent",
      "url": "http://localhost:4001/graphql",
      "enabled": true
    }
  ]
}
EOF
  success "Created default configuration"
else
  success "Gateway configuration file found"
  
  # Count enabled subgraphs
  ENABLED_COUNT=$(grep -c '"enabled": true' "$CONFIG_PATH")
  info "Configuration has $ENABLED_COUNT enabled subgraphs"
fi

# Verify package.json dependencies
section "Checking Dependencies"

# Check if required packages are installed
REQUIRED_PACKAGES=("@apollo/gateway" "@apollo/server" "express" "cors" "body-parser")
MISSING_PACKAGES=()

for pkg in "${REQUIRED_PACKAGES[@]}"; do
  if ! grep -q "\"$pkg\":" "apps/core-gateway/package.json" 2>/dev/null; then
    MISSING_PACKAGES+=("$pkg")
  else
    success "Found required package: $pkg"
  fi
done

if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
  warning "Some required packages are missing from package.json"
  warning "Missing: ${MISSING_PACKAGES[*]}"
  info "The gateway may still work if these are installed in the root package.json"
fi

# Check for presence of main gateway file
if [ ! -f "apps/core-gateway/src/main.ts" ]; then
  error "Main gateway file not found at apps/core-gateway/src/main.ts"
  exit 1
else
  success "Main gateway file found"
fi

section "Checking Subgraph Services"

# Get the list of subgraph services from the config file
SUBGRAPHS=$(grep -o '"url": "[^"]*"' "$CONFIG_PATH" | sed 's/"url": "//;s/"$//')

# Check subgraph health before starting
for subgraph in $SUBGRAPHS; do
  # Extract the health endpoint
  HEALTH_URL=$(echo "$subgraph" | sed 's/graphql/health\/ready/')
  
  # Check if subgraph is running
  echo -ne "Checking subgraph at $subgraph ... "
  if curl -s -f "$HEALTH_URL" > /dev/null 2>&1; then
    success "AVAILABLE"
  else
    warning "NOT AVAILABLE (gateway will still start but federation may be incomplete)"
  fi
done

section "Starting Federation Gateway"

# Set the PORT environment variable if not already set
if [ -z "$PORT" ]; then
  export PORT=4000
  info "Using default port: $PORT"
else
  info "Using configured port: $PORT"
fi

# Set node environment if not set
if [ -z "$NODE_ENV" ]; then
  export NODE_ENV=development
  info "Using default environment: $NODE_ENV"
else
  info "Using configured environment: $NODE_ENV"
fi

# Ensure gateway directory is the working directory for correct relative paths
cd "apps/core-gateway" || { error "Failed to change to gateway directory"; exit 1; }

info "Starting Apollo Federation Gateway..."
info "Press Ctrl+C to stop the gateway"

# Start the gateway using the appropriate method
if command -v nx &> /dev/null && [ -f "../nx.json" ]; then
  # If nx is available and we're in a nx workspace
  info "Using nx to start the gateway..."
  cd - > /dev/null # Return to the original directory
  nx serve core-gateway
else
  # Use direct execution
  info "Starting gateway directly with $TSX_CMD"
  $TSX_CMD src/main.ts
fi