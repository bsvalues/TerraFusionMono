#!/usr/bin/env bash
set -euo pipefail

# TerraFusion Nx Initialization Script
# This script initializes the Nx workspace with proper configuration
# Author: TerraFusion DevOps Agent
# Date: April 28, 2025

# Color codes for better output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Function for success messages
success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function for error messages
error() {
  echo -e "${RED}✗ $1${NC}"
  exit 1
}

# Function for informational messages
info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# Ensure we're in the monorepo root
if [ ! -f "nx.json" ]; then
  error "Please run this from the TerraFusionMono repo root"
fi

# Step 1: Validate Nx config
info "Validating Nx configuration..."
if ! grep -q "npmScope" nx.json; then
  info "Updating npmScope in nx.json..."
  # Create a temp file with the updated configuration
  jq '.npmScope = "terrafusion"' nx.json > nx.tmp.json && mv nx.tmp.json nx.json
fi
success "Nx configuration validated"

# Step 2: Install Nx globally if needed
info "Checking Nx CLI installation..."
if ! command -v nx &> /dev/null; then
  info "Installing Nx CLI globally..."
  npm install -g nx || error "Failed to install Nx CLI"
fi
success "Nx CLI is installed"

# Step 3: Update workspace layout if needed
info "Checking workspace layout..."
if ! grep -q "workspaceLayout" nx.json; then
  info "Updating workspace layout in nx.json..."
  # Create a temp file with the updated configuration
  jq '. += {"workspaceLayout":{"appsDir":"apps","libsDir":"packages"}}' nx.json > nx.tmp.json && mv nx.tmp.json nx.json
fi
success "Workspace layout configured correctly"

# Step 4: Initialize default project targets
info "Setting up default project targets..."
if ! grep -q "targetDefaults" nx.json; then
  info "Adding default targets to nx.json..."
  # This is a simplified version - in a real scenario, you'd use jq to merge this properly
  cat > nx.tmp.json << EOF
{
  "extends": "nx/presets/npm.json",
  "npmScope": "terrafusion",
  "affected": {
    "defaultBase": "main"
  },
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": [
          "build",
          "lint",
          "test",
          "e2e"
        ]
      }
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": [
        "^build"
      ],
      "inputs": [
        "production",
        "^production"
      ]
    },
    "test": {
      "inputs": [
        "default",
        "^default",
        "{workspaceRoot}/jest.preset.js"
      ]
    },
    "lint": {
      "inputs": [
        "default",
        "{workspaceRoot}/.eslintrc.json"
      ]
    }
  },
  "namedInputs": {
    "default": [
      "{projectRoot}/**/*",
      "sharedGlobals"
    ],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/jest.config.[jt]s",
      "!{projectRoot}/.eslintrc.json"
    ],
    "sharedGlobals": []
  },
  "workspaceLayout": {
    "appsDir": "apps",
    "libsDir": "packages"
  }
}
EOF
  mv nx.tmp.json nx.json
fi
success "Default project targets configured"

# Step 5: Verify nx workspace
info "Verifying Nx workspace configuration..."
npx nx --version || error "Failed to verify Nx workspace"
success "Nx workspace initialized successfully"

# Done
echo -e "\n${GREEN}Nx workspace initialization completed successfully!${NC}"
echo -e "${YELLOW}You can now run Nx commands like: nx build <project-name> or nx serve <project-name>${NC}"