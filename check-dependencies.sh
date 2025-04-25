#!/bin/bash
# Script to check for outdated dependencies across the monorepo

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Define options
VERBOSE=false
CHECK_MODE="basic" # basic, vulnerabilities, updates
INCLUDE_DEV=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    --check-vulnerabilities)
      CHECK_MODE="vulnerabilities"
      shift
      ;;
    --check-updates)
      CHECK_MODE="updates"
      shift
      ;;
    --include-dev)
      INCLUDE_DEV=true
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo
      echo "Options:"
      echo "  -v, --verbose               Show detailed information about each package"
      echo "  --check-vulnerabilities     Check for known vulnerabilities (requires npm audit)"
      echo "  --check-updates             Check for available updates (requires npm-check)"
      echo "  --include-dev               Include devDependencies in the analysis"
      echo "  --help                      Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $key${NC}"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}=== TerraFusionMono Dependency Checker ===${NC}"
echo

# Check if npm is available
if ! command -v npm &> /dev/null; then
  echo -e "${RED}Error: npm not found. Please install Node.js and npm.${NC}"
  exit 1
fi

# Check if npm-check is installed if using update mode
if [ "$CHECK_MODE" == "updates" ]; then
  if ! command -v npm-check &> /dev/null; then
    echo -e "${YELLOW}npm-check is not installed. Installing globally...${NC}"
    npm install -g npm-check
    
    if ! command -v npm-check &> /dev/null; then
      echo -e "${RED}Failed to install npm-check. Falling back to basic mode.${NC}"
      CHECK_MODE="basic"
    else
      echo -e "${GREEN}npm-check installed successfully.${NC}"
    fi
  fi
fi

# Find all package.json files in the repository
echo -e "${BLUE}Searching for package.json files...${NC}"
PACKAGE_FILES=$(find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/\.*")

# Count how many package.json files we found
PACKAGE_COUNT=$(echo "$PACKAGE_FILES" | wc -l)
echo -e "${GREEN}Found $PACKAGE_COUNT package.json files${NC}"

# Create a temporary directory for analysis
TEMP_DIR=$(mktemp -d)
if [ ! -d "$TEMP_DIR" ]; then
  echo -e "${RED}Failed to create temporary directory${NC}"
  exit 1
fi

# Track all dependencies across packages
ALL_DEPS=()
DEPENDENCY_VERSIONS=()

# Function to check if a dependency is already in the list
is_in_array() {
  local dep="$1"
  for item in "${ALL_DEPS[@]}"; do
    if [ "$item" == "$dep" ]; then
      return 0
    fi
  done
  return 1
}

# Function to add a dependency to the global list
add_dependency() {
  local dep="$1"
  local version="$2"
  
  if ! is_in_array "$dep"; then
    ALL_DEPS+=("$dep")
    DEPENDENCY_VERSIONS+=("$dep:$version")
  fi
}

# Process each package.json file
echo -e "${BLUE}Analyzing dependencies...${NC}"
for package_file in $PACKAGE_FILES; do
  package_dir=$(dirname "$package_file")
  package_name=$(grep -o '"name": "[^"]*"' "$package_file" 2>/dev/null | head -1 | cut -d'"' -f4)
  
  if [ -z "$package_name" ]; then
    package_name=$(basename "$package_dir")
  fi
  
  if [ "$VERBOSE" = true ]; then
    echo -e "${CYAN}Processing $package_name ($package_dir)${NC}"
  fi
  
  # Extract dependencies
  if command -v jq &> /dev/null; then
    # Extract with jq (more accurate)
    deps=$(jq -r '.dependencies // {} | to_entries[] | "\(.key):\(.value)"' "$package_file" 2>/dev/null)
    
    if [ "$INCLUDE_DEV" = true ]; then
      dev_deps=$(jq -r '.devDependencies // {} | to_entries[] | "\(.key):\(.value)"' "$package_file" 2>/dev/null)
      deps="$deps
$dev_deps"
    fi
  else
    # Fallback to grep/sed (less accurate)
    deps_section=$(sed -n '/"dependencies"/,/}/p' "$package_file")
    deps=$(echo "$deps_section" | grep -o '"[^"]*": "[^"]*"' | sed 's/": "/:/g' | sed 's/"//g')
    
    if [ "$INCLUDE_DEV" = true ]; then
      dev_deps_section=$(sed -n '/"devDependencies"/,/}/p' "$package_file")
      dev_deps=$(echo "$dev_deps_section" | grep -o '"[^"]*": "[^"]*"' | sed 's/": "/:/g' | sed 's/"//g')
      deps="$deps
$dev_deps"
    fi
  fi
  
  # Add dependencies to the global list
  for dep in $deps; do
    if [ -n "$dep" ]; then
      dep_name=$(echo "$dep" | cut -d':' -f1)
      dep_version=$(echo "$dep" | cut -d':' -f2)
      add_dependency "$dep_name" "$dep_version"
      
      if [ "$VERBOSE" = true ]; then
        echo -e "  ${GREEN}- $dep_name:${NC} $dep_version"
      fi
    fi
  done
  
  # Perform vulnerability check if requested
  if [ "$CHECK_MODE" == "vulnerabilities" ]; then
    echo -e "${YELLOW}Checking for vulnerabilities in $package_name...${NC}"
    (cd "$package_dir" && npm audit --json > "$TEMP_DIR/${package_name}_audit.json" 2>/dev/null)
    
    if [ -s "$TEMP_DIR/${package_name}_audit.json" ]; then
      vulnerabilities=$(jq '.vulnerabilities | length' "$TEMP_DIR/${package_name}_audit.json" 2>/dev/null)
      
      if [ "$vulnerabilities" -gt 0 ]; then
        echo -e "${RED}Found $vulnerabilities vulnerabilities in $package_name${NC}"
        
        if [ "$VERBOSE" = true ]; then
          jq -r '.vulnerabilities | to_entries[] | "\(.key): \(.value.severity) severity"' "$TEMP_DIR/${package_name}_audit.json" 2>/dev/null | while read -r vuln; do
            echo -e "  ${RED}- $vuln${NC}"
          done
        fi
      else
        echo -e "${GREEN}No vulnerabilities found in $package_name${NC}"
      fi
    else
      echo -e "${YELLOW}Could not perform vulnerability check for $package_name${NC}"
    fi
  fi
  
  # Check for updates if requested
  if [ "$CHECK_MODE" == "updates" ]; then
    echo -e "${YELLOW}Checking for updates in $package_name...${NC}"
    (cd "$package_dir" && npm-check -u --no-emoji > "$TEMP_DIR/${package_name}_updates.txt" 2>/dev/null)
    
    if [ -s "$TEMP_DIR/${package_name}_updates.txt" ]; then
      outdated_count=$(grep -c "OUTDATED" "$TEMP_DIR/${package_name}_updates.txt")
      
      if [ "$outdated_count" -gt 0 ]; then
        echo -e "${YELLOW}Found $outdated_count outdated packages in $package_name${NC}"
        
        if [ "$VERBOSE" = true ]; then
          grep -A 1 "OUTDATED" "$TEMP_DIR/${package_name}_updates.txt" | while read -r line; do
            echo -e "  ${YELLOW}- $line${NC}"
          done
        fi
      else
        echo -e "${GREEN}All packages are up-to-date in $package_name${NC}"
      fi
    else
      echo -e "${YELLOW}Could not check for updates in $package_name${NC}"
    fi
  fi
  
  echo
done

# Sort dependencies by name
IFS=$'\n' SORTED_DEPS=($(sort <<<"${ALL_DEPS[*]}"))
unset IFS

# Display summary of dependencies
echo -e "${BLUE}=== Dependency Summary ===${NC}"
echo -e "${GREEN}Found ${#SORTED_DEPS[@]} unique dependencies across all packages${NC}"

# Check for version inconsistencies
echo -e "${YELLOW}Checking for version inconsistencies...${NC}"
INCONSISTENT_DEPS=()

for dep in "${SORTED_DEPS[@]}"; do
  # Get all versions of this dependency
  versions=()
  
  for ver in "${DEPENDENCY_VERSIONS[@]}"; do
    ver_name=$(echo "$ver" | cut -d':' -f1)
    
    if [ "$ver_name" == "$dep" ]; then
      ver_version=$(echo "$ver" | cut -d':' -f2)
      versions+=("$ver_version")
    fi
  done
  
  # Sort and get unique versions
  IFS=$'\n' unique_versions=($(printf "%s\n" "${versions[@]}" | sort -u))
  unset IFS
  
  # If there's more than one version, report inconsistency
  if [ ${#unique_versions[@]} -gt 1 ]; then
    INCONSISTENT_DEPS+=("$dep")
    
    echo -e "${RED}Inconsistent versions for $dep:${NC}"
    for version in "${unique_versions[@]}"; do
      echo -e "  ${BLUE}- $version${NC}"
    done
  fi
done

# Display summary of inconsistencies
if [ ${#INCONSISTENT_DEPS[@]} -gt 0 ]; then
  echo
  echo -e "${RED}Found ${#INCONSISTENT_DEPS[@]} dependencies with inconsistent versions${NC}"
  echo -e "${YELLOW}Consider standardizing these versions across the monorepo${NC}"
else
  echo -e "${GREEN}All dependencies have consistent versions across packages${NC}"
fi

# Clean up temporary files
rm -rf "$TEMP_DIR"

echo
echo -e "${BLUE}=== Dependency Check Complete ===${NC}"