#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================================${NC}"
echo -e "${GREEN}     TerraFusion Monorepo Applications Navigator         ${NC}"
echo -e "${GREEN}=========================================================${NC}"

# List all applications in the apps directory
echo -e "\n${BLUE}Available Applications:${NC}"
echo -e "${YELLOW}------------------------${NC}"

# Get app directories from workspace.json
if [ -f "workspace.json" ]; then
  APPS_JSON=$(cat workspace.json | grep -o '"[^"]*": "apps/[^"]*"' | sed 's/"//g' | sed 's/: /:/g')
  
  # Format and print apps from workspace.json
  echo -e "${YELLOW}ID  |  APP NAME  |  DIRECTORY${NC}"
  echo -e "${YELLOW}---------------------------${NC}"
  
  COUNT=1
  for APP in $APPS_JSON; do
    APP_NAME=$(echo $APP | cut -d':' -f1)
    APP_PATH=$(echo $APP | cut -d':' -f2)
    echo -e "${GREEN}$COUNT${NC}   |  ${BLUE}$APP_NAME${NC}  |  ${YELLOW}$APP_PATH${NC}"
    ((COUNT++))
  done
  
  # Also show any other apps that might not be in workspace.json
  if [ -d "apps" ]; then
    for APP_DIR in apps/*; do
      if [ -d "$APP_DIR" ]; then
        APP_NAME=$(basename $APP_DIR)
        # Check if this app wasn't already listed
        if ! echo "$APPS_JSON" | grep -q "apps/$APP_NAME"; then
          echo -e "${GREEN}$COUNT${NC}   |  ${BLUE}$APP_NAME${NC}  |  ${YELLOW}$APP_DIR${NC} (not in workspace.json)"
          ((COUNT++))
        fi
      fi
    done
  fi
else
  echo "workspace.json not found. Listing from apps directory:"
  
  # If workspace.json doesn't exist, list from apps directory
  if [ -d "apps" ]; then
    COUNT=1
    for APP_DIR in apps/*; do
      if [ -d "$APP_DIR" ]; then
        APP_NAME=$(basename $APP_DIR)
        echo -e "${GREEN}$COUNT${NC}   |  ${BLUE}$APP_NAME${NC}  |  ${YELLOW}$APP_DIR${NC}"
        ((COUNT++))
      fi
    done
  else
    echo -e "${YELLOW}No apps directory found.${NC}"
  fi
fi

echo -e "\n${BLUE}Packages and Libraries:${NC}"
echo -e "${YELLOW}------------------------${NC}"

# List packages if packages directory exists
if [ -d "packages" ]; then
  COUNT=1
  for PKG_DIR in packages/*; do
    if [ -d "$PKG_DIR" ]; then
      PKG_NAME=$(basename $PKG_DIR)
      echo -e "${GREEN}$COUNT${NC}   |  ${BLUE}$PKG_NAME${NC}  |  ${YELLOW}$PKG_DIR${NC}"
      ((COUNT++))
    fi
  done
else
  echo -e "${YELLOW}No packages directory found.${NC}"
fi

echo -e "\n${BLUE}Plugins:${NC}"
echo -e "${YELLOW}------------------------${NC}"

# List plugins if plugins directory exists
if [ -d "plugins" ]; then
  COUNT=1
  for PLUGIN_DIR in plugins/*; do
    if [ -d "$PLUGIN_DIR" ]; then
      PLUGIN_NAME=$(basename $PLUGIN_DIR)
      echo -e "${GREEN}$COUNT${NC}   |  ${BLUE}$PLUGIN_NAME${NC}  |  ${YELLOW}$PLUGIN_DIR${NC}"
      ((COUNT++))
    fi
  done
else
  echo -e "${YELLOW}No plugins directory found.${NC}"
fi

echo -e "\n${GREEN}=========================================================${NC}"
echo -e "${BLUE}How to work with applications:${NC}"
echo -e "${YELLOW}------------------------${NC}"
echo -e "1. To start an app:         ${GREEN}nx serve app-name${NC}"
echo -e "2. To build an app:         ${GREEN}nx build app-name${NC}"
echo -e "3. To test an app:          ${GREEN}nx test app-name${NC}"
echo -e "4. To view dependencies:    ${GREEN}nx dep-graph --focus=app-name${NC}"
echo -e "\n${BLUE}Example:${NC}"
echo -e "${GREEN}nx serve terraagent${NC} - Start the TerraAgent application"
echo -e "${GREEN}=========================================================${NC}"