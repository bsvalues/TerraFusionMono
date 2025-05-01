#!/bin/bash
# Script to apply WebSocket fixes to all imported Vite applications

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to display usage information
function show_usage() {
  echo "Usage: $0 [options] [project-names...]"
  echo
  echo "Options:"
  echo "  --enhanced          Use the enhanced WebSocket fix (default: standard fix)"
  echo "  --force             Force apply the fix even if it appears to be already applied"
  echo "  --backup            Create backups of modified files"
  echo "  --dry-run           Show what would be changed without making changes"
  echo "  --all               Apply to all Vite applications in the monorepo"
  echo "  --help              Show this help message"
  echo
  echo "Examples:"
  echo "  $0 --all            Apply standard fix to all Vite applications"
  echo "  $0 --enhanced app1  Apply enhanced fix to app1"
}

# Parse command line arguments
USE_ENHANCED=false
FORCE_APPLY=false
CREATE_BACKUP=false
DRY_RUN=false
APPLY_ALL=false
PROJECT_NAMES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --enhanced)
      USE_ENHANCED=true
      shift
      ;;
    --force)
      FORCE_APPLY=true
      shift
      ;;
    --backup)
      CREATE_BACKUP=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --all)
      APPLY_ALL=true
      shift
      ;;
    --help)
      show_usage
      exit 0
      ;;
    -*)
      echo -e "${RED}Unknown option: $1${NC}"
      show_usage
      exit 1
      ;;
    *)
      PROJECT_NAMES+=("$1")
      shift
      ;;
  esac
done

# Set the script name based on the chosen method
if [ "$USE_ENHANCED" = true ]; then
  SCRIPT_NAME="vite-hmr-launcher.js"
  PLUGIN_NAME="enhanced-vite-hmr-fix-plugin.js"
  echo -e "${BLUE}Using enhanced WebSocket fix with auto-detection${NC}"
else
  SCRIPT_NAME="vite-hmr-fix.js"
  PLUGIN_NAME="vite-hmr-fix-plugin.js"
  echo -e "${BLUE}Using standard WebSocket fix${NC}"
fi

# Make sure script files exist
if [ ! -f "public/$SCRIPT_NAME" ]; then
  echo -e "${RED}Error: Client script 'public/$SCRIPT_NAME' not found${NC}"
  exit 1
fi

if [ ! -f "$PLUGIN_NAME" ]; then
  echo -e "${RED}Error: Plugin '$PLUGIN_NAME' not found${NC}"
  exit 1
fi

# Function to apply fix to a project
function apply_fix_to_project() {
  local project_name=$1
  local project_path=$2
  
  echo -e "${CYAN}Processing $project_name ($project_path)${NC}"
  
  # Check if it's a Vite project
  if [ ! -f "$project_path/package.json" ]; then
    echo -e "${YELLOW}No package.json found, skipping${NC}"
    return
  fi
  
  # Check for Vite dependency
  if ! grep -q '"vite"' "$project_path/package.json"; then
    echo -e "${YELLOW}Not a Vite project, skipping${NC}"
    return
  }
  
  echo -e "${GREEN}Vite project identified${NC}"
  
  # Apply client-side fix
  apply_client_fix "$project_path"
  
  # Apply server-side fix
  apply_server_fix "$project_path"
  
  echo -e "${GREEN}WebSocket fix applied to $project_name${NC}"
  echo
}

# Function to apply client-side fix
function apply_client_fix() {
  local project_path=$1
  
  # Possible directories to check for HTML files
  DIRECTORIES=("$project_path/public" "$project_path/src" "$project_path/index.html" "$project_path/src/index.html")
  
  # Find all HTML files in the project
  HTML_FILES=$(find "$project_path" -name "*.html" -o -name "*.ejs" -o -name "*.hbs" 2>/dev/null)
  
  if [ -z "$HTML_FILES" ]; then
    echo -e "${YELLOW}No HTML files found for client-side fix${NC}"
    return
  }
  
  # Look for main HTML file (index.html)
  INDEX_HTML=""
  for html_file in $HTML_FILES; do
    if [[ "$(basename "$html_file")" == "index.html" ]]; then
      INDEX_HTML="$html_file"
      break
    fi
  done
  
  # If no index.html, use the first HTML file found
  if [ -z "$INDEX_HTML" ]; then
    INDEX_HTML=$(echo "$HTML_FILES" | head -n 1)
  }
  
  echo -e "  ${BLUE}Applying client-side fix to:${NC} $(basename "$INDEX_HTML")"
  
  # Check if script tag is already in the file
  if grep -q "$SCRIPT_NAME" "$INDEX_HTML" && [ "$FORCE_APPLY" = false ]; then
    echo -e "  ${GREEN}Client-side fix already applied${NC}"
    return
  fi
  
  # Create backup if requested
  if [ "$CREATE_BACKUP" = true ]; then
    BACKUP_FILE="${INDEX_HTML}.backup.$(date +%Y%m%d%H%M%S)"
    if [ "$DRY_RUN" = false ]; then
      cp "$INDEX_HTML" "$BACKUP_FILE"
      echo -e "  ${BLUE}Created backup:${NC} $BACKUP_FILE"
    else
      echo -e "  ${BLUE}Would create backup:${NC} $BACKUP_FILE"
    fi
  fi
  
  # Apply the fix
  SCRIPT_TAG="<script src=\"/$SCRIPT_NAME\"></script>"
  
  if [ "$DRY_RUN" = false ]; then
    # Insert the script tag before </head>
    sed -i "s|</head>|$SCRIPT_TAG\\n</head>|" "$INDEX_HTML"
    echo -e "  ${GREEN}Added script tag to${NC} $(basename "$INDEX_HTML")"
  else
    echo -e "  ${BLUE}Would add script tag to${NC} $(basename "$INDEX_HTML")"
  fi
}

# Function to apply server-side fix
function apply_server_fix() {
  local project_path=$1
  
  # Find vite.config.js or vite.config.ts
  VITE_CONFIG=""
  if [ -f "$project_path/vite.config.js" ]; then
    VITE_CONFIG="$project_path/vite.config.js"
  elif [ -f "$project_path/vite.config.ts" ]; then
    VITE_CONFIG="$project_path/vite.config.ts"
  fi
  
  if [ -z "$VITE_CONFIG" ]; then
    echo -e "  ${YELLOW}No Vite config file found, skipping server-side fix${NC}"
    return
  }
  
  echo -e "  ${BLUE}Applying server-side fix to:${NC} $(basename "$VITE_CONFIG")"
  
  # Check if plugin is already imported
  PLUGIN_IMPORT_NAME=$(basename "$PLUGIN_NAME" .js)
  if grep -q "$PLUGIN_IMPORT_NAME" "$VITE_CONFIG" && [ "$FORCE_APPLY" = false ]; then
    echo -e "  ${GREEN}Server-side fix already applied${NC}"
    return
  fi
  
  # Determine relative path to plugin
  REL_PATH=$(node -e "
    const path = require('path');
    const relativePath = path.relative('$(dirname "$VITE_CONFIG")', '$(pwd)');
    console.log(relativePath ? relativePath + '/$PLUGIN_NAME' : './$PLUGIN_NAME');
  ")
  
  # Create backup if requested
  if [ "$CREATE_BACKUP" = true ]; then
    BACKUP_FILE="${VITE_CONFIG}.backup.$(date +%Y%m%d%H%M%S)"
    if [ "$DRY_RUN" = false ]; then
      cp "$VITE_CONFIG" "$BACKUP_FILE"
      echo -e "  ${BLUE}Created backup:${NC} $BACKUP_FILE"
    else
      echo -e "  ${BLUE}Would create backup:${NC} $BACKUP_FILE"
    fi
  fi
  
  if [ "$DRY_RUN" = false ]; then
    # Add the import statement
    if grep -q "import " "$VITE_CONFIG"; then
      # Add after the last import
      sed -i "/import .*/a\\
import ${PLUGIN_IMPORT_NAME} from '$REL_PATH';" "$VITE_CONFIG"
    else
      # Add at the beginning of the file
      sed -i "1i\\
import ${PLUGIN_IMPORT_NAME} from '$REL_PATH';" "$VITE_CONFIG"
    fi
    
    # Add the plugin to plugins array
    if grep -q "plugins:" "$VITE_CONFIG"; then
      # Add to existing plugins array
      if [ "$USE_ENHANCED" = true ]; then
        sed -i "/plugins:/s/\[/\[${PLUGIN_IMPORT_NAME}({ verbose: true }),/" "$VITE_CONFIG"
      else
        sed -i "/plugins:/s/\[/\[${PLUGIN_IMPORT_NAME}(),/" "$VITE_CONFIG"
      fi
    else
      # No plugins array found, add it before the closing brace
      if [ "$USE_ENHANCED" = true ]; then
        sed -i "/export default/a\\
  plugins: [${PLUGIN_IMPORT_NAME}({ verbose: true })],\\
" "$VITE_CONFIG"
      else
        sed -i "/export default/a\\
  plugins: [${PLUGIN_IMPORT_NAME}()],\\
" "$VITE_CONFIG"
      fi
    fi
    
    echo -e "  ${GREEN}Added plugin to${NC} $(basename "$VITE_CONFIG")"
  else
    echo -e "  ${BLUE}Would add plugin to${NC} $(basename "$VITE_CONFIG")"
    echo -e "  ${BLUE}Import:${NC} import ${PLUGIN_IMPORT_NAME} from '$REL_PATH';"
    if [ "$USE_ENHANCED" = true ]; then
      echo -e "  ${BLUE}Plugin:${NC} ${PLUGIN_IMPORT_NAME}({ verbose: true })"
    else
      echo -e "  ${BLUE}Plugin:${NC} ${PLUGIN_IMPORT_NAME}()"
    fi
  fi
}

# Process projects based on user input
if [ "$APPLY_ALL" = true ]; then
  echo -e "${BLUE}Scanning for all Vite applications...${NC}"
  
  # Check if workspace.json exists
  WORKSPACE_FILE="workspace.json"
  if [ ! -f "$WORKSPACE_FILE" ]; then
    echo -e "${RED}Error: workspace.json file not found!${NC}"
    exit 1
  }
  
  # Get project paths from workspace.json
  if command -v jq &> /dev/null; then
    # Get all project paths from workspace.json using jq
    PROJECTS=$(jq -r '.projects | to_entries[] | "\(.key):\(.value)"' "$WORKSPACE_FILE")
  else
    # Fallback to grep/sed if jq is not available
    echo -e "${YELLOW}Warning: jq is not installed. Using grep/sed for JSON parsing (less reliable).${NC}"
    PROJECTS=$(grep -o '"[^"]*": "[^"]*"' "$WORKSPACE_FILE" | sed 's/": "/:/g' | sed 's/"//g')
  fi
  
  # Process each project
  for project_line in $PROJECTS; do
    project_name=$(echo "$project_line" | cut -d':' -f1)
    project_path=$(echo "$project_line" | cut -d':' -f2)
    
    apply_fix_to_project "$project_name" "$project_path"
  done
else
  # If no projects specified, show usage
  if [ ${#PROJECT_NAMES[@]} -eq 0 ]; then
    echo -e "${RED}Error: No projects specified${NC}"
    show_usage
    exit 1
  fi
  
  # Process specified projects
  for project_name in "${PROJECT_NAMES[@]}"; do
    # Get project path from workspace.json
    if command -v jq &> /dev/null; then
      project_path=$(jq -r ".projects[\"$project_name\"] // \"\"" workspace.json)
    else
      project_path=$(grep -o "\"$project_name\": \"[^\"]*\"" workspace.json | cut -d'"' -f4)
    fi
    
    if [ -z "$project_path" ] || [ ! -d "$project_path" ]; then
      echo -e "${RED}Error: Project '$project_name' not found in workspace${NC}"
      continue
    }
    
    apply_fix_to_project "$project_name" "$project_path"
  done
fi

echo -e "${BLUE}All done!${NC}"

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}This was a dry run. No changes were made.${NC}"
  echo -e "${YELLOW}Run without --dry-run to apply the changes.${NC}"
fi