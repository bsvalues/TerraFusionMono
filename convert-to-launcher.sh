#!/bin/bash
# Script to convert existing WebSocket fixes to use the launcher

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Converting applications to use vite-hmr-launcher.js${NC}"
echo

# Check if we're in the root directory
if [ ! -f "workspace.json" ]; then
  echo -e "${RED}Error: workspace.json not found!${NC}"
  echo -e "${YELLOW}Please run this script from the repository root directory.${NC}"
  exit 1
fi

# Function to find index.html files in a directory
function find_html_files() {
  local directory=$1
  find "$directory" -name "index.html" 2>/dev/null
}

# Function to check if a file contains a specific string
function file_contains() {
  local file=$1
  local pattern=$2
  grep -q "$pattern" "$file"
  return $?
}

# Function to replace script tag in HTML file
function replace_script_tag() {
  local file=$1
  local old_pattern=$2
  local new_tag='<script src="/vite-hmr-launcher.js"></script>'
  
  # Create backup if file exists and is not empty
  if [ -s "$file" ]; then
    local backup="${file}.bak"
    cp "$file" "$backup"
    echo -e "  Created backup: ${YELLOW}${backup}${NC}"
  fi
  
  if file_contains "$file" "$old_pattern"; then
    # Replace existing WebSocket fix script with launcher
    sed -i "s|<script src=\"$old_pattern\"></script>|$new_tag|g" "$file"
    echo -e "  ${GREEN}Replaced${NC} $old_pattern with launcher in $file"
    return 0
  else
    # If no existing script found, add launcher before </head>
    if file_contains "$file" "</head>"; then
      sed -i "s|</head>|$new_tag\\n</head>|" "$file"
      echo -e "  ${GREEN}Added${NC} launcher to $file"
      return 0
    else
      echo -e "  ${RED}Could not find </head> tag in $file${NC}"
      return 1
    fi
  fi
}

# Get list of projects from workspace.json
projects=$(jq -r '.projects | keys[]' workspace.json 2>/dev/null)

if [ -z "$projects" ]; then
  echo -e "${RED}No projects found in workspace.json${NC}"
  exit 1
fi

# Track conversion counts
total_files=0
converted_files=0
already_using_launcher=0
errors=0

for project in $projects; do
  # Get project path
  project_path=$(jq -r --arg name "$project" '.projects[$name]' workspace.json)
  
  echo -e "${BLUE}Processing project:${NC} $project ($project_path)"
  
  # Find all index.html files
  html_files=$(find_html_files "$project_path")
  
  if [ -z "$html_files" ]; then
    echo -e "  ${YELLOW}No index.html files found${NC}"
    continue
  fi
  
  # Process each HTML file
  for html_file in $html_files; do
    ((total_files++))
    
    echo -e "  Examining ${YELLOW}$(basename "$(dirname "$html_file")")/$(basename "$html_file")${NC}"
    
    # Check if already using the launcher
    if file_contains "$html_file" "vite-hmr-launcher.js"; then
      echo -e "  ${GREEN}Already using launcher${NC}"
      ((already_using_launcher++))
      continue
    fi
    
    # Check for known WebSocket fix scripts and replace with launcher
    if file_contains "$html_file" "vite-hmr-fix.js"; then
      replace_script_tag "$html_file" "vite-hmr-fix.js"
      ((converted_files++))
    elif file_contains "$html_file" "improved-vite-hmr-fix.js"; then
      replace_script_tag "$html_file" "improved-vite-hmr-fix.js"
      ((converted_files++))
    elif file_contains "$html_file" "janeway-vite-hmr-fix.js"; then
      replace_script_tag "$html_file" "janeway-vite-hmr-fix.js"
      ((converted_files++))
    else
      echo -e "  ${YELLOW}No WebSocket fix script found, adding launcher${NC}"
      if replace_script_tag "$html_file" "NONEXISTENT_PATTERN"; then
        ((converted_files++))
      else
        ((errors++))
      fi
    fi
  done
  
  echo
done

# Summary
echo -e "${BLUE}Conversion Summary:${NC}"
echo -e "Total HTML files examined: ${GREEN}$total_files${NC}"
echo -e "Files already using launcher: ${GREEN}$already_using_launcher${NC}"
echo -e "Files converted to launcher: ${GREEN}$converted_files${NC}"
echo -e "Errors encountered: ${errors > 0 ? "${RED}$errors${NC}" : "${GREEN}$errors${NC}"}"
echo

if [ $errors -eq 0 ]; then
  echo -e "${GREEN}Conversion completed successfully!${NC}"
else
  echo -e "${YELLOW}Conversion completed with some errors.${NC}"
fi