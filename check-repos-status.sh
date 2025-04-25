#!/bin/bash
# Script to check the status of each repository in the TerraFusionMono workspace

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TerraFusionMono Repository Status Check ===${NC}"
echo

# Read the workspace.json file to get all projects
WORKSPACE_FILE="workspace.json"
if [ ! -f "$WORKSPACE_FILE" ]; then
  echo -e "${RED}Error: workspace.json file not found!${NC}"
  exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}Warning: jq is not installed. Using grep/sed for JSON parsing (less reliable).${NC}"
  
  # Extract project paths using grep/sed
  PROJECTS=$(grep -o '"projects": {[^}]*}' $WORKSPACE_FILE | sed 's/"projects": {//g' | sed 's/}//g' | tr ',' '\n' | sed 's/"//g' | sed 's/: /:/g')
  
  # Process each project
  echo "$PROJECTS" | while read -r line; do
    if [ -n "$line" ]; then
      PROJECT_NAME=$(echo $line | cut -d':' -f1)
      PROJECT_PATH=$(echo $line | cut -d':' -f2)
      
      echo -e "${BLUE}Checking ${PROJECT_NAME}...${NC}"
      
      if [ -d "$PROJECT_PATH" ]; then
        echo -e "  ${GREEN}✓ Directory exists:${NC} $PROJECT_PATH"
        
        # Check for package.json
        if [ -f "${PROJECT_PATH}/package.json" ]; then
          echo -e "  ${GREEN}✓ package.json found${NC}"
          
          # Extract version and name
          PKG_VERSION=$(grep -o '"version": "[^"]*"' ${PROJECT_PATH}/package.json | head -1 | cut -d'"' -f4)
          PKG_NAME=$(grep -o '"name": "[^"]*"' ${PROJECT_PATH}/package.json | head -1 | cut -d'"' -f4)
          
          echo -e "  ${BLUE}ℹ Package:${NC} $PKG_NAME@$PKG_VERSION"
          
          # Check for dependencies
          DEPS_COUNT=$(grep -o '"dependencies":' ${PROJECT_PATH}/package.json | wc -l)
          if [ $DEPS_COUNT -gt 0 ]; then
            echo -e "  ${GREEN}✓ Has dependencies${NC}"
          else
            echo -e "  ${YELLOW}⚠ No dependencies found${NC}"
          fi
        else
          echo -e "  ${YELLOW}⚠ No package.json found${NC}"
        fi
        
        # Check for source files
        SRC_DIR="${PROJECT_PATH}/src"
        if [ -d "$SRC_DIR" ]; then
          FILES_COUNT=$(find $SRC_DIR -type f | wc -l)
          echo -e "  ${GREEN}✓ src directory found with ${FILES_COUNT} files${NC}"
        else
          echo -e "  ${YELLOW}⚠ No src directory found${NC}"
        fi
        
        # Check for GraphQL schema
        if [ -f "${PROJECT_PATH}/src/graphql/schema.js" ] || [ -f "${PROJECT_PATH}/src/graphql/schema.ts" ]; then
          echo -e "  ${GREEN}✓ GraphQL schema found${NC}"
        fi
      else
        echo -e "  ${RED}✗ Directory does not exist:${NC} $PROJECT_PATH"
      fi
      
      echo ""
    fi
  done
else
  # Use jq for better JSON parsing
  # Get list of projects and their paths
  PROJECTS=$(jq -r '.projects | to_entries | .[] | .key + ":" + .value' $WORKSPACE_FILE)
  
  # Process each project
  echo "$PROJECTS" | while read -r line; do
    PROJECT_NAME=$(echo $line | cut -d':' -f1)
    PROJECT_PATH=$(echo $line | cut -d':' -f2)
    
    echo -e "${BLUE}Checking ${PROJECT_NAME}...${NC}"
    
    if [ -d "$PROJECT_PATH" ]; then
      echo -e "  ${GREEN}✓ Directory exists:${NC} $PROJECT_PATH"
      
      # Check for package.json
      if [ -f "${PROJECT_PATH}/package.json" ]; then
        echo -e "  ${GREEN}✓ package.json found${NC}"
        
        # Extract details using jq
        PKG_NAME=$(jq -r '.name // "not-specified"' ${PROJECT_PATH}/package.json)
        PKG_VERSION=$(jq -r '.version // "not-specified"' ${PROJECT_PATH}/package.json)
        
        echo -e "  ${BLUE}ℹ Package:${NC} $PKG_NAME@$PKG_VERSION"
        
        # Check for dependencies
        if jq -e '.dependencies' ${PROJECT_PATH}/package.json > /dev/null 2>&1; then
          DEPS_COUNT=$(jq '.dependencies | length' ${PROJECT_PATH}/package.json)
          echo -e "  ${GREEN}✓ Has ${DEPS_COUNT} dependencies${NC}"
        else
          echo -e "  ${YELLOW}⚠ No dependencies found${NC}"
        fi
      else
        echo -e "  ${YELLOW}⚠ No package.json found${NC}"
      fi
      
      # Check for source files
      SRC_DIR="${PROJECT_PATH}/src"
      if [ -d "$SRC_DIR" ]; then
        FILES_COUNT=$(find $SRC_DIR -type f | wc -l)
        echo -e "  ${GREEN}✓ src directory found with ${FILES_COUNT} files${NC}"
      else
        echo -e "  ${YELLOW}⚠ No src directory found${NC}"
      fi
      
      # Check for GraphQL schema
      if [ -f "${PROJECT_PATH}/src/graphql/schema.js" ] || [ -f "${PROJECT_PATH}/src/graphql/schema.ts" ]; then
        echo -e "  ${GREEN}✓ GraphQL schema found${NC}"
      fi
    else
      echo -e "  ${RED}✗ Directory does not exist:${NC} $PROJECT_PATH"
    fi
    
    echo ""
  done
fi

echo -e "${BLUE}=== Status Check Complete ===${NC}"
echo
echo -e "For detailed information on specific repositories, run: ${YELLOW}nx show project [project-name]${NC}"