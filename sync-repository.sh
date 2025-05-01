#!/bin/bash
# Script to synchronize a local repository with the monorepo structure

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage information
usage() {
  echo "Usage: $0 <operation> [options]"
  echo
  echo "Operations:"
  echo "  export <project-name> <output-dir>  Export a project from the monorepo to a standalone repository"
  echo "  import <repo-path> [project-name]   Import an external repository into the monorepo"
  echo "  update <project-name>               Update a project in the monorepo with latest changes"
  echo
  echo "Examples:"
  echo "  $0 export terraagent ~/exported-repos/"
  echo "  $0 import ~/my-repos/new-feature-repo my-feature"
  echo "  $0 update terrafusionpro"
  exit 1
}

# Check required commands
check_dependencies() {
  for cmd in rsync find grep sed; do
    if ! command -v $cmd &> /dev/null; then
      echo -e "${RED}Error: Required command '$cmd' not found${NC}"
      exit 1
    fi
  done
}

# Function to export a project from the monorepo
export_project() {
  if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}Error: Missing project name or output directory${NC}"
    usage
  fi
  
  PROJECT_NAME=$1
  OUTPUT_DIR=$2
  
  echo -e "${BLUE}=== Exporting project '$PROJECT_NAME' ===${NC}"
  
  # Get project path from workspace.json
  PROJECT_PATH=""
  if command -v jq &> /dev/null; then
    if [ -f "workspace.json" ]; then
      PROJECT_PATH=$(jq -r ".projects[\"$PROJECT_NAME\"] // \"\"" workspace.json)
    fi
  else
    if [ -f "workspace.json" ]; then
      PROJECT_PATH=$(grep -o "\"$PROJECT_NAME\": \"[^\"]*\"" workspace.json | head -1 | cut -d'"' -f4)
    fi
  fi
  
  if [ -z "$PROJECT_PATH" ] || [ ! -d "$PROJECT_PATH" ]; then
    echo -e "${RED}Error: Project '$PROJECT_NAME' not found in workspace${NC}"
    exit 1
  fi
  
  # Create output directory
  mkdir -p "$OUTPUT_DIR"
  if [ ! -d "$OUTPUT_DIR" ]; then
    echo -e "${RED}Error: Cannot create output directory '$OUTPUT_DIR'${NC}"
    exit 1
  fi
  
  # Export the project
  EXPORT_PATH="$OUTPUT_DIR/$PROJECT_NAME"
  mkdir -p "$EXPORT_PATH"
  
  echo -e "${BLUE}Copying files from $PROJECT_PATH to $EXPORT_PATH${NC}"
  rsync -av --progress "$PROJECT_PATH/" "$EXPORT_PATH/" --exclude node_modules --exclude .git
  
  # Create a basic package.json if it doesn't exist
  if [ ! -f "$EXPORT_PATH/package.json" ]; then
    echo -e "${YELLOW}Creating basic package.json${NC}"
    cat > "$EXPORT_PATH/package.json" << EOF
{
  "name": "$PROJECT_NAME",
  "version": "1.0.0",
  "description": "Exported from TerraFusionMono",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {}
}
EOF
  fi
  
  # Initialize git repository
  echo -e "${BLUE}Initializing Git repository${NC}"
  (cd "$EXPORT_PATH" && git init && git add . && git commit -m "Initial export from TerraFusionMono")
  
  echo -e "${GREEN}Successfully exported project '$PROJECT_NAME' to $EXPORT_PATH${NC}"
  echo -e "${YELLOW}Note: You may need to update dependencies and paths for standalone usage${NC}"
}

# Function to import an external repository
import_project() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Missing repository path${NC}"
    usage
  fi
  
  REPO_PATH=$1
  
  if [ ! -d "$REPO_PATH" ]; then
    echo -e "${RED}Error: Repository path '$REPO_PATH' does not exist${NC}"
    exit 1
  }
  
  # Get project name from argument or directory name
  if [ -z "$2" ]; then
    PROJECT_NAME=$(basename "$REPO_PATH" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
  else
    PROJECT_NAME=$2
  fi
  
  echo -e "${BLUE}=== Importing repository to project '$PROJECT_NAME' ===${NC}"
  
  # Create project directory in apps/
  TARGET_PATH="apps/$PROJECT_NAME"
  mkdir -p "$TARGET_PATH"
  
  # Copy repository contents
  echo -e "${BLUE}Copying files from $REPO_PATH to $TARGET_PATH${NC}"
  rsync -av --progress "$REPO_PATH/" "$TARGET_PATH/" --exclude node_modules --exclude .git
  
  # Update workspace.json
  if [ -f "workspace.json" ]; then
    if command -v jq &> /dev/null; then
      # Use jq to update workspace.json
      echo -e "${BLUE}Updating workspace.json with jq${NC}"
      jq --arg name "$PROJECT_NAME" --arg path "$TARGET_PATH" '.projects += {($name): $path}' workspace.json > workspace.json.tmp
      mv workspace.json.tmp workspace.json
    else
      # Manual update of workspace.json
      echo -e "${YELLOW}jq not found, manually updating workspace.json${NC}"
      PROJECTS_START=$(grep -n '"projects": {' workspace.json | cut -d':' -f1)
      if [ -n "$PROJECTS_START" ]; then
        PROJECTS_START=$((PROJECTS_START + 1))
        sed -i "${PROJECTS_START}i\\    \"$PROJECT_NAME\": \"$TARGET_PATH\"," workspace.json
      else
        echo -e "${RED}Error: Cannot update workspace.json, 'projects' section not found${NC}"
      fi
    fi
    
    echo -e "${GREEN}Updated workspace.json with new project${NC}"
  else
    echo -e "${RED}Error: workspace.json not found${NC}"
  fi
  
  echo -e "${GREEN}Successfully imported repository to '$TARGET_PATH'${NC}"
  echo -e "${YELLOW}Note: You may need to run dependency installation and integration scripts:${NC}"
  echo -e "  1. Install dependencies: ${BLUE}npm install${NC}"
  echo -e "  2. Update Gateway configuration: ${BLUE}./update-gateway-config.sh${NC}"
  echo -e "  3. Apply WebSocket fix (if needed): ${BLUE}./check-vite-apps.sh${NC}"
}

# Function to update a project with external changes
update_project() {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: Missing project name${NC}"
    usage
  fi
  
  PROJECT_NAME=$1
  
  echo -e "${BLUE}=== Updating project '$PROJECT_NAME' ===${NC}"
  
  # Get project path from workspace.json
  PROJECT_PATH=""
  if command -v jq &> /dev/null; then
    if [ -f "workspace.json" ]; then
      PROJECT_PATH=$(jq -r ".projects[\"$PROJECT_NAME\"] // \"\"" workspace.json)
    fi
  else
    if [ -f "workspace.json" ]; then
      PROJECT_PATH=$(grep -o "\"$PROJECT_NAME\": \"[^\"]*\"" workspace.json | head -1 | cut -d'"' -f4)
    fi
  fi
  
  if [ -z "$PROJECT_PATH" ] || [ ! -d "$PROJECT_PATH" ]; then
    echo -e "${RED}Error: Project '$PROJECT_NAME' not found in workspace${NC}"
    exit 1
  fi
  
  # Prompt for repository path
  read -p "Enter path to the updated repository: " REPO_PATH
  
  if [ ! -d "$REPO_PATH" ]; then
    echo -e "${RED}Error: Repository path '$REPO_PATH' does not exist${NC}"
    exit 1
  }
  
  # Create backup
  BACKUP_PATH="${PROJECT_PATH}_backup_$(date +%Y%m%d%H%M%S)"
  echo -e "${BLUE}Creating backup at $BACKUP_PATH${NC}"
  cp -R "$PROJECT_PATH" "$BACKUP_PATH"
  
  # Update the project
  echo -e "${BLUE}Updating files from $REPO_PATH to $PROJECT_PATH${NC}"
  rsync -av --progress "$REPO_PATH/" "$PROJECT_PATH/" --exclude node_modules --exclude .git
  
  echo -e "${GREEN}Successfully updated project '$PROJECT_NAME'${NC}"
  echo -e "${YELLOW}Note: A backup was created at $BACKUP_PATH${NC}"
  echo -e "${YELLOW}You may need to run dependency installation and integration tests:${NC}"
  echo -e "  1. Install dependencies: ${BLUE}npm install${NC}"
  echo -e "  2. Update Gateway configuration: ${BLUE}./update-gateway-config.sh${NC}"
  echo -e "  3. Check WebSocket compatibility: ${BLUE}./check-vite-apps.sh${NC}"
}

# Main execution
check_dependencies

if [ -z "$1" ]; then
  usage
fi

case "$1" in
  "export")
    export_project "$2" "$3"
    ;;
  "import")
    import_project "$2" "$3"
    ;;
  "update")
    update_project "$2"
    ;;
  *)
    echo -e "${RED}Error: Unknown operation '$1'${NC}"
    usage
    ;;
esac