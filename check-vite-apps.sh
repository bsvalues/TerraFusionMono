#!/bin/bash
# Script to identify Vite applications in the monorepo that might need WebSocket fixes

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TerraFusionMono Vite Applications Scanner ===${NC}"
echo

# Function to check if a project uses Vite
check_for_vite() {
  local project_path=$1
  local project_name=$(basename "$project_path")
  
  echo -e "${BLUE}Checking ${project_name}...${NC}"
  
  # Check if project directory exists
  if [ ! -d "$project_path" ]; then
    echo -e "  ${RED}✗ Directory does not exist:${NC} $project_path"
    return
  fi
  
  # Indicators that a project uses Vite
  local is_vite=false
  local has_hmr_fix=false
  local hmr_fix_location=""
  
  # Check package.json for Vite
  if [ -f "$project_path/package.json" ]; then
    if grep -q '"vite"' "$project_path/package.json"; then
      is_vite=true
      echo -e "  ${GREEN}✓ Uses Vite${NC} (found in package.json)"
    fi
  fi
  
  # Check for vite.config.js or vite.config.ts
  if [ -f "$project_path/vite.config.js" ] || [ -f "$project_path/vite.config.ts" ]; then
    is_vite=true
    echo -e "  ${GREEN}✓ Uses Vite${NC} (found vite.config file)"
    
    # Check if vite config already includes HMR fix plugin
    if [ -f "$project_path/vite.config.js" ]; then
      if grep -q "viteHmrFixPlugin" "$project_path/vite.config.js"; then
        has_hmr_fix=true
        echo -e "  ${GREEN}✓ HMR fix already applied${NC} (in vite.config.js)"
      fi
    fi
    
    if [ -f "$project_path/vite.config.ts" ]; then
      if grep -q "viteHmrFixPlugin" "$project_path/vite.config.ts"; then
        has_hmr_fix=true
        echo -e "  ${GREEN}✓ HMR fix already applied${NC} (in vite.config.ts)"
      fi
    fi
  fi
  
  # If project uses Vite but doesn't have the HMR fix
  if [ "$is_vite" = true ] && [ "$has_hmr_fix" = false ]; then
    echo -e "  ${YELLOW}⚠ HMR fix not applied${NC}"
    
    # Check for HTML files that might need the client-side fix
    local html_files=$(find "$project_path" -name "*.html" -o -name "*.ejs" -o -name "*.hbs")
    
    if [ -n "$html_files" ]; then
      echo -e "  ${BLUE}ℹ HTML files found:${NC}"
      
      # Check each HTML file for the vite-hmr-fix.js script
      for html_file in $html_files; do
        if grep -q "vite-hmr-fix.js" "$html_file"; then
          has_hmr_fix=true
          hmr_fix_location="$html_file"
          echo -e "    ${GREEN}✓ HMR fix script found in:${NC} $(basename "$html_file")"
        else
          echo -e "    ${YELLOW}⚠ $(basename "$html_file")${NC} might need HMR fix script"
        fi
      done
    else
      echo -e "  ${YELLOW}⚠ No HTML files found for client-side fix${NC}"
    fi
  fi
  
  # Print the final summary for this project
  if [ "$is_vite" = true ]; then
    if [ "$has_hmr_fix" = true ]; then
      echo -e "  ${GREEN}✓ Vite HMR fix is applied${NC}"
    else
      echo -e "  ${RED}✗ Needs Vite HMR fix for Replit environment${NC}"
      echo -e "  ${BLUE}ℹ Fix instructions:${NC}"
      echo -e "    1. Add ${YELLOW}<script src=\"/vite-hmr-fix.js\"></script>${NC} to the HTML <head>"
      echo -e "    2. Import and use the HMR fix plugin in vite.config.js:"
      echo -e "       ${YELLOW}import viteHmrFixPlugin from '../../vite-hmr-fix-plugin.js';${NC}"
      echo -e "       ${YELLOW}plugins: [..., viteHmrFixPlugin()],${NC}"
    fi
  else
    echo -e "  ${BLUE}ℹ Not a Vite application${NC}"
  fi
  
  echo ""
}

# Check workspace.json for projects
WORKSPACE_FILE="workspace.json"
if [ ! -f "$WORKSPACE_FILE" ]; then
  echo -e "${RED}Error: workspace.json file not found!${NC}"
  exit 1
fi

# Check if jq is available for better JSON parsing
if command -v jq &> /dev/null; then
  # Get all project paths from workspace.json
  PROJECTS=$(jq -r '.projects | to_entries | .[] | .value' $WORKSPACE_FILE)
  
  for project_path in $PROJECTS; do
    check_for_vite "$project_path"
  done
else
  # Fallback to grep/sed if jq is not available
  echo -e "${YELLOW}Warning: jq is not installed. Using grep/sed for JSON parsing (less reliable).${NC}"
  
  # Extract project paths using grep/sed
  PROJECTS=$(grep -o '"projects": {[^}]*}' $WORKSPACE_FILE | sed 's/"projects": {//g' | sed 's/}//g' | tr ',' '\n' | sed 's/"//g' | sed 's/.*://g')
  
  for project_path in $PROJECTS; do
    if [ -n "$project_path" ]; then
      check_for_vite "$project_path"
    fi
  done
fi

echo -e "${BLUE}=== Scan Complete ===${NC}"
echo
echo -e "For more information on fixing WebSocket issues, see:"
echo -e "${YELLOW}docs/WEBSOCKET_FIX.md${NC} and ${YELLOW}docs/WEBSOCKET_TESTING.md${NC}"