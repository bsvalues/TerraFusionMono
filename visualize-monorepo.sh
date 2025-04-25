#!/bin/bash
# Script to visualize the TerraFusionMono structure and dependencies

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TerraFusionMono Repository Visualization ===${NC}"
echo

# Check dependencies
if ! command -v find &> /dev/null; then
  echo -e "${RED}Error: 'find' command not found${NC}"
  exit 1
fi

if ! command -v grep &> /dev/null; then
  echo -e "${RED}Error: 'grep' command not found${NC}"
  exit 1
fi

# Check workspace.json existence
WORKSPACE_FILE="workspace.json"
if [ ! -f "$WORKSPACE_FILE" ]; then
  echo -e "${RED}Error: workspace.json file not found!${NC}"
  exit 1
fi

# Display monorepo structure overview
echo -e "${CYAN}=== Repository Structure ===${NC}"

# Show top-level directories
echo -e "${YELLOW}Top-level directories:${NC}"
find . -maxdepth 1 -type d -not -path "*/\.*" | sort | while read -r dir; do
  if [ "$dir" != "." ]; then
    dir_name=$(basename "$dir")
    count=$(find "$dir" -type f | wc -l)
    echo -e "  ${GREEN}• $dir_name/${NC} ($count files)"
  fi
done

echo

# Display registered projects from workspace.json
echo -e "${CYAN}=== Registered Projects (from workspace.json) ===${NC}"

# Check if jq is available
if command -v jq &> /dev/null; then
  # Use jq for better JSON parsing
  PROJECT_COUNT=$(jq '.projects | length' "$WORKSPACE_FILE")
  echo -e "${YELLOW}Found $PROJECT_COUNT registered projects${NC}"
  
  # Group projects by type
  TERRA_PROJECTS=$(jq -r '.projects | keys[] | select(. | test("^terra"))' "$WORKSPACE_FILE" | sort)
  BCBS_PROJECTS=$(jq -r '.projects | keys[] | select(. | test("^bcbs"))' "$WORKSPACE_FILE" | sort)
  OTHER_PROJECTS=$(jq -r '.projects | keys[] | select(. | test("^(terra|bcbs)") | not)' "$WORKSPACE_FILE" | sort)
  
  # Display Terra projects
  echo -e "${GREEN}Terra Projects:${NC}"
  for project in $TERRA_PROJECTS; do
    path=$(jq -r ".projects[\"$project\"]" "$WORKSPACE_FILE")
    echo -e "  ${BLUE}• $project${NC} → $path"
  done
  
  echo
  
  # Display BCBS projects
  echo -e "${GREEN}BCBS Projects:${NC}"
  for project in $BCBS_PROJECTS; do
    path=$(jq -r ".projects[\"$project\"]" "$WORKSPACE_FILE")
    echo -e "  ${BLUE}• $project${NC} → $path"
  done
  
  echo
  
  # Display other projects
  echo -e "${GREEN}Other Projects:${NC}"
  for project in $OTHER_PROJECTS; do
    path=$(jq -r ".projects[\"$project\"]" "$WORKSPACE_FILE")
    echo -e "  ${BLUE}• $project${NC} → $path"
  done
else
  # Fallback to grep/sed if jq is not available
  echo -e "${YELLOW}Warning: jq is not installed. Using grep/sed for JSON parsing (less reliable).${NC}"
  echo -e "${YELLOW}Install jq for better visualization.${NC}"
  
  PROJECTS=$(grep -o '"[^"]*": "[^"]*"' "$WORKSPACE_FILE" | sed 's/": "/:/g' | sed 's/"//g')
  
  for project_line in $PROJECTS; do
    project=$(echo "$project_line" | cut -d':' -f1)
    path=$(echo "$project_line" | cut -d':' -f2)
    
    if [[ "$project" == projects* ]]; then
      continue
    fi
    
    echo -e "  ${BLUE}• $project${NC} → $path"
  done
fi

echo

# Display Gateway configuration if available
GATEWAY_CONFIG="apps/core-gateway/src/graphql/subgraphs.config.json"
if [ -f "$GATEWAY_CONFIG" ]; then
  echo -e "${CYAN}=== Federation Gateway Configuration ===${NC}"
  
  if command -v jq &> /dev/null; then
    SERVICE_COUNT=$(jq 'length' "$GATEWAY_CONFIG")
    echo -e "${YELLOW}Found $SERVICE_COUNT registered GraphQL services${NC}"
    
    jq -r 'to_entries[] | "  • \(.key): \(.value)"' "$GATEWAY_CONFIG" | while read -r line; do
      service_name=$(echo "$line" | cut -d':' -f1)
      service_url=$(echo "$line" | cut -d':' -f2- | sed 's/^ //')
      echo -e "  ${BLUE}$service_name${NC} → $service_url"
    done
  else
    echo -e "${YELLOW}Install jq to see detailed Gateway configuration.${NC}"
    cat "$GATEWAY_CONFIG"
  fi
else
  echo -e "${YELLOW}Gateway configuration not found at $GATEWAY_CONFIG${NC}"
fi

echo

# Show dependency connections between projects if package.json files exist
echo -e "${CYAN}=== Project Dependencies ===${NC}"

if command -v jq &> /dev/null; then
  # Get list of projects from workspace.json
  PROJECTS=$(jq -r '.projects | to_entries[] | .value' "$WORKSPACE_FILE")
  
  # Track internal dependencies
  echo -e "${YELLOW}Internal dependencies between projects:${NC}"
  
  FOUND_DEPS=false
  
  for project_path in $PROJECTS; do
    project_name=$(basename "$project_path")
    pkg_file="$project_path/package.json"
    
    if [ -f "$pkg_file" ]; then
      # Extract all dependencies
      all_deps=$(jq -r '.dependencies // {} | to_entries[] | .key' "$pkg_file" 2>/dev/null)
      
      # Check if any dependency matches another project
      for dep in $all_deps; do
        # Check if this dependency is another project in the monorepo
        for other_project_path in $PROJECTS; do
          other_project_name=$(basename "$other_project_path")
          other_pkg_file="$other_project_path/package.json"
          
          if [ -f "$other_pkg_file" ]; then
            other_pkg_name=$(jq -r '.name // ""' "$other_pkg_file" 2>/dev/null)
            
            if [ "$other_pkg_name" = "$dep" ]; then
              echo -e "  ${GREEN}• $project_name${NC} depends on ${BLUE}$other_project_name${NC}"
              FOUND_DEPS=true
            fi
          fi
        done
      done
    fi
  done
  
  if [ "$FOUND_DEPS" = false ]; then
    echo -e "  ${YELLOW}No internal dependencies found between projects${NC}"
    echo -e "  ${YELLOW}This may indicate that projects are not yet integrated in the monorepo structure${NC}"
  fi
else
  echo -e "${YELLOW}Install jq to analyze project dependencies.${NC}"
fi

echo

# Check for WebSocket fix implementation
echo -e "${CYAN}=== WebSocket Fix Status ===${NC}"

# Check for the fix files
WS_FIX_CLIENT="client/public/vite-hmr-fix.js"
WS_FIX_PUBLIC="public/vite-hmr-fix.js"
WS_FIX_PLUGIN="vite-hmr-fix-plugin.js"

if [ -f "$WS_FIX_CLIENT" ] || [ -f "$WS_FIX_PUBLIC" ]; then
  echo -e "${GREEN}WebSocket HMR fix is implemented:${NC}"
  
  if [ -f "$WS_FIX_CLIENT" ]; then
    echo -e "  ${BLUE}• Client-side fix:${NC} $WS_FIX_CLIENT"
  fi
  
  if [ -f "$WS_FIX_PUBLIC" ]; then
    echo -e "  ${BLUE}• Public fix:${NC} $WS_FIX_PUBLIC"
  fi
  
  if [ -f "$WS_FIX_PLUGIN" ]; then
    echo -e "  ${BLUE}• Plugin:${NC} $WS_FIX_PLUGIN"
  fi
else
  echo -e "${YELLOW}WebSocket HMR fix not found${NC}"
fi

echo

# Check for documentation
echo -e "${CYAN}=== Documentation Status ===${NC}"

DOCS_DIR="docs"
if [ -d "$DOCS_DIR" ]; then
  echo -e "${GREEN}Documentation available:${NC}"
  
  find "$DOCS_DIR" -type f -name "*.md" | sort | while read -r doc_file; do
    doc_name=$(basename "$doc_file")
    # Extract title from markdown file (assuming first line is # Title)
    title=$(head -n 1 "$doc_file" | sed 's/^# //')
    echo -e "  ${BLUE}• $doc_name${NC} - $title"
  done
else
  echo -e "${YELLOW}Documentation directory not found${NC}"
fi

echo

# Show utility scripts
echo -e "${CYAN}=== Utility Scripts ===${NC}"

echo -e "${GREEN}Available scripts:${NC}"
find . -maxdepth 1 -name "*.sh" | sort | while read -r script; do
  script_name=$(basename "$script")
  if [ -x "$script" ]; then
    perm="executable"
    perm_color=$GREEN
  else
    perm="not executable"
    perm_color=$YELLOW
  fi
  echo -e "  ${BLUE}• $script_name${NC} (${perm_color}$perm${NC})"
done

echo

# Show custom test scripts
echo -e "${CYAN}=== Test Scripts ===${NC}"

find . -maxdepth 1 -name "test-*.js" | sort | while read -r test_script; do
  test_name=$(basename "$test_script")
  echo -e "  ${BLUE}• $test_name${NC}"
done

echo
echo -e "${BLUE}=== Visualization Complete ===${NC}"
echo
echo -e "For detailed reports on specific aspects of the monorepo, use:"
echo -e "  ${YELLOW}• ./check-repos-status.sh${NC} - Check status of all repositories"
echo -e "  ${YELLOW}• ./check-vite-apps.sh${NC} - Identify Vite apps that need WebSocket fixes"
echo -e "  ${YELLOW}• ./update-gateway-config.sh${NC} - Update the gateway configuration with new services"