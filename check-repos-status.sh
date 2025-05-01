#!/bin/bash
# Script to check the status of all repositories in the TerraFusionMono workspace

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Checking TerraFusionMono repositories status...${NC}"

# Check if we're in the root directory
if [ ! -f "workspace.json" ]; then
  echo -e "${RED}Error: workspace.json not found!${NC}"
  echo -e "${YELLOW}Please run this script from the repository root directory.${NC}"
  exit 1
fi

# Function to check if jq is installed
function check_jq() {
  if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed${NC}"
    echo -e "${YELLOW}Please install jq to use this script${NC}"
    exit 1
  fi
}

check_jq

# Get a list of all projects from workspace.json
function get_projects() {
  jq -r '.projects | keys[]' workspace.json
}

# Get the path for a specific project
function get_project_path() {
  local project_name=$1
  jq -r --arg name "$project_name" '.projects[$name]' workspace.json
}

# Check if a directory contains a Git repository
function is_git_repo() {
  local path=$1
  if [ -d "$path/.git" ]; then
    return 0 # true
  else
    return 1 # false
  fi
}

# Check if a directory contains a package.json
function has_package_json() {
  local path=$1
  if [ -f "$path/package.json" ]; then
    return 0 # true
  else
    return 1 # false
  fi
}

# Check for GraphQL schema files
function has_graphql_schema() {
  local path=$1
  if [ -f "$path/schema.graphql" ] || [ -f "$path/src/schema.graphql" ] || [ -d "$path/src/graphql" ]; then
    return 0 # true
  else
    return 1 # false
  fi
}

# Display summary of project information
echo -e "${BLUE}Project Summary:${NC}"
echo

# Get project count
project_count=$(get_projects | wc -l)
echo -e "Total projects: ${GREEN}$project_count${NC}"

# Initialize counters
git_count=0
npm_count=0
graphql_count=0
terra_count=0
bcbs_count=0
other_count=0

# Process each project
get_projects | while read -r project; do
  path=$(get_project_path "$project")
  
  # Determine project type
  if [[ "$project" == terra* ]]; then
    project_type="${GREEN}Terra${NC}"
    ((terra_count++))
  elif [[ "$project" == bcbs* ]] || [[ "$project" == bsbc* ]] || [[ "$project" == bs* ]]; then
    project_type="${YELLOW}BCBS${NC}"
    ((bcbs_count++))
  else
    project_type="${BLUE}Other${NC}"
    ((other_count++))
  fi
  
  # Check Git status
  if is_git_repo "$path"; then
    git_status="${GREEN}Git${NC}"
    ((git_count++))
  else
    git_status="${RED}No Git${NC}"
  fi
  
  # Check for package.json
  if has_package_json "$path"; then
    npm_status="${GREEN}NPM${NC}"
    ((npm_count++))
  else
    npm_status="${RED}No NPM${NC}"
  fi
  
  # Check for GraphQL schema
  if has_graphql_schema "$path"; then
    graphql_status="${GREEN}GraphQL${NC}"
    ((graphql_count++))
  else
    graphql_status="${RED}No GraphQL${NC}"
  fi
  
  # Print project status
  echo -e "${project_type} ${BLUE}$project${NC} ($path)"
  echo -e "  ${git_status} | ${npm_status} | ${graphql_status}"
done

# Display counts
echo
echo -e "${BLUE}Repository Types:${NC}"
echo -e "Terra Repositories: ${GREEN}$terra_count${NC}"
echo -e "BCBS Repositories:  ${YELLOW}$bcbs_count${NC}"
echo -e "Other Repositories: ${BLUE}$other_count${NC}"
echo
echo -e "${BLUE}Repository Features:${NC}"
echo -e "Git Repositories:     ${GREEN}$git_count${NC} / $project_count"
echo -e "NPM Packages:         ${GREEN}$npm_count${NC} / $project_count"
echo -e "GraphQL Services:     ${GREEN}$graphql_count${NC} / $project_count"

# Check subgraph configuration
echo
echo -e "${BLUE}Checking Federation Gateway Configuration:${NC}"
gateway_config="apps/core-gateway/src/graphql/subgraphs.config.json"

if [ -f "$gateway_config" ]; then
  subgraph_count=$(jq '.subgraphs | length' "$gateway_config")
  enabled_count=$(jq '.subgraphs | map(select(.enabled == true)) | length' "$gateway_config")
  
  echo -e "Subgraphs configured: ${GREEN}$subgraph_count${NC}"
  echo -e "Subgraphs enabled:    ${GREEN}$enabled_count${NC}"
  
  # Check for missing GraphQL services
  echo
  echo -e "${BLUE}Checking for missing subgraphs in gateway config:${NC}"
  
  missing_count=0
  get_projects | while read -r project; do
    path=$(get_project_path "$project")
    
    # If project has GraphQL schema but not in gateway config
    if has_graphql_schema "$path"; then
      exists_in_config=$(jq -r --arg name "$project" '.subgraphs | map(select(.name == $name)) | length' "$gateway_config")
      
      if [ "$exists_in_config" -eq 0 ]; then
        echo -e "${YELLOW}Warning: $project has GraphQL schema but is not configured in gateway${NC}"
        ((missing_count++))
      fi
    fi
  done
  
  if [ "$missing_count" -eq 0 ]; then
    echo -e "${GREEN}All GraphQL services are configured in gateway${NC}"
  fi
else
  echo -e "${RED}Gateway configuration file not found!${NC}"
  echo -e "${YELLOW}Expected location: $gateway_config${NC}"
fi

echo
echo -e "${BLUE}Status check complete!${NC}"