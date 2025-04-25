#!/bin/bash
# Script to scan the monorepo for GraphQL services and update the gateway configuration

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TerraFusionMono Gateway Configuration Update ===${NC}"
echo

# Define the path to the gateway config
GATEWAY_CONFIG="apps/core-gateway/src/graphql/subgraphs.config.json"

# Check if the config file exists
if [ ! -f "$GATEWAY_CONFIG" ]; then
  echo -e "${RED}Error: Gateway configuration file not found at $GATEWAY_CONFIG${NC}"
  echo -e "${YELLOW}Creating a new configuration file...${NC}"
  
  # Create the directory if it doesn't exist
  mkdir -p $(dirname "$GATEWAY_CONFIG")
  
  # Create a default empty config
  echo "{}" > "$GATEWAY_CONFIG"
fi

# Read the current config
if command -v jq &> /dev/null; then
  # Use jq for better JSON handling
  CURRENT_SERVICES=$(jq -r 'keys[]' "$GATEWAY_CONFIG" 2>/dev/null || echo "")
else
  echo -e "${YELLOW}Warning: jq is not installed. Limited functionality available.${NC}"
  echo -e "${YELLOW}Please install jq for better JSON handling.${NC}"
  # Use grep as a fallback
  CURRENT_SERVICES=$(grep -o '"[^"]*": "[^"]*"' "$GATEWAY_CONFIG" | cut -d'"' -f2)
fi

echo -e "${BLUE}Current services in gateway configuration:${NC}"
if [ -z "$CURRENT_SERVICES" ]; then
  echo -e "  ${YELLOW}No services found in current configuration${NC}"
else
  for service in $CURRENT_SERVICES; do
    if command -v jq &> /dev/null; then
      URL=$(jq -r ".[\"$service\"]" "$GATEWAY_CONFIG")
    else
      URL=$(grep -o "\"$service\": \"[^\"]*\"" "$GATEWAY_CONFIG" | cut -d'"' -f4)
    fi
    echo -e "  ${GREEN}- $service:${NC} $URL"
  done
fi

echo
echo -e "${BLUE}Scanning for GraphQL services in the monorepo...${NC}"

# Find potential GraphQL services
# Look for files that might indicate a GraphQL service
FOUND_SERVICES=()

# Check workspace.json for project paths
if [ -f "workspace.json" ]; then
  if command -v jq &> /dev/null; then
    PROJECTS=$(jq -r '.projects | to_entries | .[] | .value' workspace.json)
  else
    PROJECTS=$(grep -o '"projects": {[^}]*}' workspace.json | sed 's/"projects": {//g' | sed 's/}//g' | tr ',' '\n' | sed 's/"//g' | sed 's/.*://g')
  fi
  
  # Check each project for GraphQL indicators
  for project_path in $PROJECTS; do
    project_name=$(basename "$project_path")
    
    # Skip the core-gateway itself
    if [ "$project_name" == "core-gateway" ]; then
      continue
    fi
    
    # Check for common GraphQL indicators
    HAS_GRAPHQL=false
    
    # Check for GraphQL schema files
    if [ -f "$project_path/src/graphql/schema.js" ] || \
       [ -f "$project_path/src/graphql/schema.ts" ] || \
       [ -f "$project_path/src/schema.graphql" ] || \
       [ -f "$project_path/schema.graphql" ]; then
      HAS_GRAPHQL=true
    fi
    
    # Check for Apollo dependencies in package.json
    if [ -f "$project_path/package.json" ]; then
      if grep -q "@apollo/server\|apollo-server\|@apollo/subgraph" "$project_path/package.json"; then
        HAS_GRAPHQL=true
      fi
    fi
    
    if [ "$HAS_GRAPHQL" = true ]; then
      FOUND_SERVICES+=("$project_name")
      echo -e "  ${GREEN}Found GraphQL service:${NC} $project_name ($project_path)"
    fi
  done
else
  echo -e "${RED}Error: workspace.json not found!${NC}"
  exit 1
fi

echo
echo -e "${BLUE}Found ${#FOUND_SERVICES[@]} potential GraphQL services${NC}"

# Prepare new configuration
NEW_CONFIG="{}"

# Add existing services to new config
if [ ! -z "$CURRENT_SERVICES" ]; then
  for service in $CURRENT_SERVICES; do
    if command -v jq &> /dev/null; then
      URL=$(jq -r ".[\"$service\"]" "$GATEWAY_CONFIG")
      NEW_CONFIG=$(echo $NEW_CONFIG | jq --arg svc "$service" --arg url "$URL" '. + {($svc): $url}')
    else
      echo -e "${YELLOW}Cannot update config without jq. Please install jq.${NC}"
      exit 1
    fi
  done
fi

# Add or update found services
DEFAULT_PORT=4000
NEXT_PORT=4001

for service in "${FOUND_SERVICES[@]}"; do
  # Skip if already in config
  if echo "$CURRENT_SERVICES" | grep -q "$service"; then
    echo -e "  ${BLUE}Service '$service' already in configuration${NC}"
    continue
  fi
  
  # Assign a port
  while true; do
    # Check if this port is already in use
    PORT_IN_USE=false
    if command -v jq &> /dev/null; then
      for existing_url in $(jq -r '.[]' "$GATEWAY_CONFIG"); do
        if echo "$existing_url" | grep -q ":$NEXT_PORT/"; then
          PORT_IN_USE=true
          break
        fi
      done
    else
      PORT_IN_USE=true # Skip this check without jq
    fi
    
    if [ "$PORT_IN_USE" = false ]; then
      break
    fi
    
    # Try next port
    NEXT_PORT=$((NEXT_PORT + 1))
  done
  
  # Suggest URL for new service
  NEW_URL="http://localhost:$NEXT_PORT/graphql"
  
  echo -e "  ${YELLOW}Adding new service:${NC} $service with URL $NEW_URL"
  
  if command -v jq &> /dev/null; then
    NEW_CONFIG=$(echo $NEW_CONFIG | jq --arg svc "$service" --arg url "$NEW_URL" '. + {($svc): $url}')
  else
    echo -e "${YELLOW}Cannot update config without jq. Please install jq.${NC}"
    exit 1
  fi
  
  NEXT_PORT=$((NEXT_PORT + 1))
done

# Ask for confirmation
echo
echo -e "${BLUE}Preview of the new configuration:${NC}"
if command -v jq &> /dev/null; then
  echo -e "${GREEN}$(echo $NEW_CONFIG | jq .)${NC}"
else
  echo -e "${RED}Cannot display JSON preview without jq${NC}"
fi

echo
read -p "Do you want to update the gateway configuration? (y/n): " CONFIRM

if [[ $CONFIRM =~ ^[Yy]$ ]]; then
  # Backup the old config
  BACKUP_FILE="${GATEWAY_CONFIG}.backup.$(date +%Y%m%d%H%M%S)"
  cp "$GATEWAY_CONFIG" "$BACKUP_FILE"
  echo -e "${BLUE}Backed up old configuration to ${BACKUP_FILE}${NC}"
  
  # Write the new config
  if command -v jq &> /dev/null; then
    echo $NEW_CONFIG | jq . > "$GATEWAY_CONFIG"
  else
    echo -e "${RED}Cannot write formatted JSON without jq${NC}"
    echo $NEW_CONFIG > "$GATEWAY_CONFIG"
  fi
  
  echo -e "${GREEN}Updated gateway configuration successfully!${NC}"
  echo -e "Don't forget to restart the gateway for changes to take effect:"
  echo -e "${YELLOW}./start-gateway.sh${NC}"
else
  echo -e "${YELLOW}Operation cancelled. No changes made.${NC}"
fi