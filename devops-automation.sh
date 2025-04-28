#!/usr/bin/env bash
set -euo pipefail

# TerraFusion DevOps Automation Script
# This script executes all the required DevOps tasks in sequence
# Author: TerraFusion DevOps Agent
# Date: April 28, 2025

# Color codes for better output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Function to print section headers
section() {
  echo -e "\n${BLUE}=== $1 ===${NC}"
}

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

# Start execution
echo -e "${GREEN}Starting TerraFusion DevOps Automation${NC}"
echo -e "${YELLOW}Date: $(date)${NC}"
echo -e "${YELLOW}Environment: $(uname -a)${NC}"

# Step 1: Run import scripts for every repo
section "Step 1: Importing Repositories"
chmod +x ./import-repos.sh
./import-repos.sh || error "Failed to import repositories"
success "All repositories imported successfully"

# Step 2: Initialize Nx
section "Step 2: Initializing Nx Workspace"
chmod +x ./scripts/initialize-nx.sh
./scripts/initialize-nx.sh || error "Failed to initialize Nx workspace"
success "Nx workspace initialized successfully"

# Step 3: Serve each app
section "Step 3: Setting up App Services"
chmod +x ./scripts/setup-services.sh
./scripts/setup-services.sh || error "Failed to setup services"
success "All app services configured successfully"

# Step 4: Configure Apollo Gateway
section "Step 4: Configuring Apollo Gateway"
chmod +x ./scripts/configure-gateway.sh
./scripts/configure-gateway.sh || error "Failed to configure Apollo Gateway"
success "Apollo Gateway configured successfully"

# Step 5: Update CI
section "Step 5: Updating CI Configuration"
chmod +x ./scripts/update-ci.sh
./scripts/update-ci.sh || error "Failed to update CI configuration"
success "CI configuration updated successfully"

# Step 6: Create and run smoke tests
section "Step 6: Running Smoke Tests"
chmod +x ./scripts/run-smoke-tests.sh
./scripts/run-smoke-tests.sh || error "Failed to run smoke tests"
success "All smoke tests passed"

# All done
echo -e "\n${GREEN}✅ All done${NC}"