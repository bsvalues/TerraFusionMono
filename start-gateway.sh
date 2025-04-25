#!/bin/bash
# Script to start the TerraFusion Federation Gateway

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting TerraFusion Federation Gateway...${NC}"

# Check if the gateway directory exists
if [ ! -d "apps/core-gateway" ]; then
  echo -e "${RED}Gateway directory not found!${NC}"
  echo -e "${YELLOW}Make sure you're running this script from the repository root directory.${NC}"
  exit 1
fi

# Make sure node is installed
if ! command -v node &> /dev/null; then
  echo -e "${RED}Node.js is not installed or not in PATH${NC}"
  exit 1
fi

# Check if the config file exists
if [ ! -f "apps/core-gateway/src/graphql/subgraphs.config.json" ]; then
  echo -e "${RED}Gateway configuration file not found!${NC}"
  echo -e "${YELLOW}Creating default configuration...${NC}"
  mkdir -p apps/core-gateway/src/graphql
  cat > apps/core-gateway/src/graphql/subgraphs.config.json << EOF
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
  echo -e "${GREEN}Created default configuration${NC}"
fi

# Use nx if available, otherwise use node
if command -v nx &> /dev/null; then
  echo -e "${GREEN}Using nx to start the gateway...${NC}"
  nx serve core-gateway
else
  echo -e "${YELLOW}nx not found, using node directly...${NC}"
  cd apps/core-gateway
  if [ -f "tsconfig.json" ]; then
    # TypeScript project
    echo -e "${GREEN}Running TypeScript project...${NC}"
    if command -v ts-node &> /dev/null; then
      ts-node src/index.ts
    else
      echo -e "${YELLOW}ts-node not found, using node with tsx...${NC}"
      if command -v tsx &> /dev/null; then
        tsx src/index.ts
      else
        echo -e "${RED}No TypeScript runner found. Please install ts-node or tsx.${NC}"
        exit 1
      fi
    fi
  else
    # JavaScript project
    echo -e "${GREEN}Running JavaScript project...${NC}"
    node src/index.js
  fi
fi