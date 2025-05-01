#!/usr/bin/env bash
set -euo pipefail

# TerraFusion CI Configuration Update Script
# This script sets up CI/CD configuration for GitHub Actions
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

# Create GitHub Actions directory
info "Setting up GitHub Actions directory structure..."
mkdir -p .github/workflows

# Create main CI workflow for the monorepo
MAIN_CI_FILE=".github/workflows/main.yml"
info "Creating main CI workflow file: $MAIN_CI_FILE"

cat > "$MAIN_CI_FILE" << EOF
name: TerraFusion CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [20.x]
    
    steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup NX cache
      uses: nrwl/nx-set-shas@v3
    
    - name: Lint affected projects
      run: npx nx affected --target=lint
    
    - name: Build affected projects
      run: npx nx affected --target=build
    
    - name: Test affected projects
      run: npx nx affected --target=test
  
  gateway-test:
    runs-on: ubuntu-latest
    needs: build
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js 20.x
      uses: actions/setup-node@v3
      with:
        node-version: 20.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build gateway
      run: npx nx build core-gateway
    
    - name: Run gateway tests
      run: npx nx test core-gateway
    
    - name: Run gateway integration tests
      run: |
        # Start required backend services for integration testing
        npx nx serve core-gateway &
        sleep 10
        # Run integration tests against the running gateway
        cd apps/core-gateway && npm run test:integration
  
  smoke-tests:
    runs-on: ubuntu-latest
    needs: [build, gateway-test]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js 20.x
      uses: actions/setup-node@v3
      with:
        node-version: 20.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run smoke tests
      run: ./scripts/run-smoke-tests.sh
EOF

success "Main CI workflow file created"

# Create deploy workflow
DEPLOY_WORKFLOW=".github/workflows/deploy.yml"
info "Creating deployment workflow file: $DEPLOY_WORKFLOW"

cat > "$DEPLOY_WORKFLOW" << EOF
name: TerraFusion Deploy

on:
  push:
    branches: [ main ]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
    
    - name: Use Node.js 20.x
      uses: actions/setup-node@v3
      with:
        node-version: 20.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build all projects
      run: npx nx run-many --target=build --all
    
    - name: Run all tests
      run: npx nx run-many --target=test --all
    
    - name: Package artifacts
      run: |
        mkdir -p dist
        tar -czf dist/terrafusion-mono.tar.gz --exclude=node_modules --exclude=.git .
    
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: terrafusion-build
        path: dist/*.tar.gz
  
  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Download artifacts
      uses: actions/download-artifact@v3
      with:
        name: terrafusion-build
        path: dist
    
    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment..."
        # Add actual deployment steps for your environment
  
  deploy-production:
    runs-on: ubuntu-latest
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    
    steps:
    - name: Download artifacts
      uses: actions/download-artifact@v3
      with:
        name: terrafusion-build
        path: dist
    
    - name: Deploy to production
      run: |
        echo "Deploying to production environment..."
        # Add actual deployment steps for your environment
EOF

success "Deployment workflow file created"

# Create pull request workflow
PR_WORKFLOW=".github/workflows/pull-request.yml"
info "Creating pull request workflow file: $PR_WORKFLOW"

cat > "$PR_WORKFLOW" << EOF
name: TerraFusion PR Checks

on:
  pull_request:
    branches: [ main, develop ]

jobs:
  lint:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
    
    - name: Use Node.js 20.x
      uses: actions/setup-node@v3
      with:
        node-version: 20.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup NX cache
      uses: nrwl/nx-set-shas@v3
    
    - name: Lint affected projects
      run: npx nx affected:lint --base=origin/\${{ github.base_ref }}
  
  build:
    runs-on: ubuntu-latest
    needs: lint
    
    steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
    
    - name: Use Node.js 20.x
      uses: actions/setup-node@v3
      with:
        node-version: 20.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup NX cache
      uses: nrwl/nx-set-shas@v3
    
    - name: Build affected projects
      run: npx nx affected:build --base=origin/\${{ github.base_ref }}
  
  test:
    runs-on: ubuntu-latest
    needs: build
    
    steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
    
    - name: Use Node.js 20.x
      uses: actions/setup-node@v3
      with:
        node-version: 20.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup NX cache
      uses: nrwl/nx-set-shas@v3
    
    - name: Test affected projects
      run: npx nx affected:test --base=origin/\${{ github.base_ref }}
EOF

success "Pull request workflow file created"

# Verify CI configuration
info "Verifying CI configuration..."
if [ -f "$MAIN_CI_FILE" ] && [ -f "$DEPLOY_WORKFLOW" ] && [ -f "$PR_WORKFLOW" ]; then
  success "CI configuration verified successfully"
else
  error "CI configuration verification failed"
fi

# Done
echo -e "\n${GREEN}CI configuration has been successfully updated!${NC}"
echo -e "${YELLOW}The following CI workflows have been created:${NC}"
echo -e "${YELLOW}1. ${MAIN_CI_FILE} - Main CI workflow for the monorepo${NC}"
echo -e "${YELLOW}2. ${DEPLOY_WORKFLOW} - Deployment workflow${NC}"
echo -e "${YELLOW}3. ${PR_WORKFLOW} - Pull request checks workflow${NC}"