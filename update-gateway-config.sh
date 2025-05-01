#!/bin/bash
# Script to update the TerraFusion Federation Gateway configuration

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CONFIG_PATH="apps/core-gateway/src/graphql/subgraphs.config.json"

# Function to display usage information
function show_usage() {
  echo "Usage: $0 [options]"
  echo
  echo "Options:"
  echo "  --add NAME URL     Add a subgraph with NAME and URL"
  echo "  --remove NAME      Remove a subgraph by NAME"
  echo "  --enable NAME      Enable a subgraph by NAME"
  echo "  --disable NAME     Disable a subgraph by NAME"
  echo "  --list             List all configured subgraphs"
  echo "  --help             Show this help message"
  echo
  echo "Examples:"
  echo "  $0 --add terraagent http://localhost:4001/graphql"
  echo "  $0 --remove terraagent"
  echo "  $0 --disable terraagent"
  echo "  $0 --list"
}

# Function to check if jq is installed
function check_jq() {
  if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed${NC}"
    echo -e "${YELLOW}Please install jq to use this script${NC}"
    exit 1
  fi
}

# Function to check if config file exists
function check_config() {
  if [ ! -f "$CONFIG_PATH" ]; then
    echo -e "${YELLOW}Config file not found. Creating new config...${NC}"
    mkdir -p $(dirname "$CONFIG_PATH")
    echo '{"subgraphs": []}' > "$CONFIG_PATH"
    echo -e "${GREEN}Created new config file${NC}"
  fi
}

# Function to list all subgraphs
function list_subgraphs() {
  check_jq
  check_config
  
  echo -e "${BLUE}TerraFusion Federation Gateway Subgraphs:${NC}"
  jq -r '.subgraphs | .[] | "\(.name) | \(.url) | \(.enabled)"' "$CONFIG_PATH" | while read -r line; do
    name=$(echo $line | cut -d'|' -f1 | xargs)
    url=$(echo $line | cut -d'|' -f2 | xargs)
    enabled=$(echo $line | cut -d'|' -f3 | xargs)
    
    if [ "$enabled" = "true" ]; then
      status="${GREEN}ENABLED${NC}"
    else
      status="${YELLOW}DISABLED${NC}"
    fi
    
    echo -e " - ${BLUE}$name${NC} (${status})"
    echo -e "   URL: $url"
  done
  
  count=$(jq '.subgraphs | length' "$CONFIG_PATH")
  enabled_count=$(jq '.subgraphs | map(select(.enabled == true)) | length' "$CONFIG_PATH")
  
  echo
  echo -e "${BLUE}Total:${NC} $count subgraphs, $enabled_count enabled"
}

# Function to add a subgraph
function add_subgraph() {
  check_jq
  check_config
  
  name=$1
  url=$2
  
  if [ -z "$name" ] || [ -z "$url" ]; then
    echo -e "${RED}Error: Both name and URL are required${NC}"
    show_usage
    exit 1
  fi
  
  # Check if subgraph already exists
  exists=$(jq -r --arg name "$name" '.subgraphs | map(select(.name == $name)) | length' "$CONFIG_PATH")
  
  if [ "$exists" -gt 0 ]; then
    echo -e "${YELLOW}Subgraph '$name' already exists. Updating URL...${NC}"
    jq --arg name "$name" --arg url "$url" '(.subgraphs[] | select(.name == $name) | .url) = $url' "$CONFIG_PATH" > "$CONFIG_PATH.tmp"
    mv "$CONFIG_PATH.tmp" "$CONFIG_PATH"
    echo -e "${GREEN}Updated subgraph '$name' with URL '$url'${NC}"
  else
    # Add new subgraph
    jq --arg name "$name" --arg url "$url" '.subgraphs += [{"name": $name, "url": $url, "enabled": true}]' "$CONFIG_PATH" > "$CONFIG_PATH.tmp"
    mv "$CONFIG_PATH.tmp" "$CONFIG_PATH"
    echo -e "${GREEN}Added new subgraph '$name' with URL '$url'${NC}"
  fi
}

# Function to remove a subgraph
function remove_subgraph() {
  check_jq
  check_config
  
  name=$1
  
  if [ -z "$name" ]; then
    echo -e "${RED}Error: Subgraph name is required${NC}"
    show_usage
    exit 1
  fi
  
  # Check if subgraph exists
  exists=$(jq -r --arg name "$name" '.subgraphs | map(select(.name == $name)) | length' "$CONFIG_PATH")
  
  if [ "$exists" -eq 0 ]; then
    echo -e "${YELLOW}Subgraph '$name' does not exist${NC}"
    exit 0
  fi
  
  # Remove subgraph
  jq --arg name "$name" '.subgraphs = (.subgraphs | map(select(.name != $name)))' "$CONFIG_PATH" > "$CONFIG_PATH.tmp"
  mv "$CONFIG_PATH.tmp" "$CONFIG_PATH"
  echo -e "${GREEN}Removed subgraph '$name'${NC}"
}

# Function to enable/disable a subgraph
function set_subgraph_state() {
  check_jq
  check_config
  
  name=$1
  enabled=$2
  
  if [ -z "$name" ]; then
    echo -e "${RED}Error: Subgraph name is required${NC}"
    show_usage
    exit 1
  fi
  
  # Check if subgraph exists
  exists=$(jq -r --arg name "$name" '.subgraphs | map(select(.name == $name)) | length' "$CONFIG_PATH")
  
  if [ "$exists" -eq 0 ]; then
    echo -e "${YELLOW}Subgraph '$name' does not exist${NC}"
    exit 0
  fi
  
  # Update subgraph state
  jq --arg name "$name" --argjson enabled "$enabled" '(.subgraphs[] | select(.name == $name) | .enabled) = $enabled' "$CONFIG_PATH" > "$CONFIG_PATH.tmp"
  mv "$CONFIG_PATH.tmp" "$CONFIG_PATH"
  
  if [ "$enabled" = "true" ]; then
    echo -e "${GREEN}Enabled subgraph '$name'${NC}"
  else
    echo -e "${YELLOW}Disabled subgraph '$name'${NC}"
  fi
}

# Parse command line arguments
if [ $# -eq 0 ]; then
  show_usage
  exit 0
fi

case "$1" in
  --add)
    add_subgraph "$2" "$3"
    ;;
  --remove)
    remove_subgraph "$2"
    ;;
  --enable)
    set_subgraph_state "$2" true
    ;;
  --disable)
    set_subgraph_state "$2" false
    ;;
  --list)
    list_subgraphs
    ;;
  --help)
    show_usage
    ;;
  *)
    echo -e "${RED}Unknown option: $1${NC}"
    show_usage
    exit 1
    ;;
esac