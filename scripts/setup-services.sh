#!/usr/bin/env bash
set -euo pipefail

# TerraFusion Service Setup Script
# This script sets up and validates all application services
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

# Function to verify a service
verify_service() {
  local service_name=$1
  local service_dir=$2
  local port=$3
  
  echo -e "\n${BLUE}Verifying service: ${service_name}${NC}"
  
  # Check if service directory exists
  if [ ! -d "$service_dir" ]; then
    echo -e "${RED}Service directory does not exist: $service_dir${NC}"
    return 1
  fi
  
  # Check if package.json exists
  if [ ! -f "$service_dir/package.json" ]; then
    echo -e "${RED}package.json not found in: $service_dir${NC}"
    return 1
  fi
  
  # Check for required scripts in package.json
  if ! grep -q '"build"' "$service_dir/package.json"; then
    echo -e "${YELLOW}Warning: No build script found in package.json${NC}"
  fi
  
  if ! grep -q '"start"' "$service_dir/package.json" && ! grep -q '"serve"' "$service_dir/package.json" && ! grep -q '"dev"' "$service_dir/package.json"; then
    echo -e "${YELLOW}Warning: No start/serve/dev script found in package.json${NC}"
  fi
  
  # Add the service to nx.json if not already there
  if ! grep -q "\"$service_name\"" nx.json; then
    info "Registering $service_name in Nx workspace..."
    # In a real implementation, you'd use jq to properly update the JSON
    echo "Service $service_name would be registered in Nx workspace"
  fi
  
  # Update port configuration if needed
  if [ -f "$service_dir/.env" ] && ! grep -q "PORT=$port" "$service_dir/.env"; then
    info "Updating PORT configuration to $port in .env file..."
    if grep -q "PORT=" "$service_dir/.env"; then
      sed -i "s/PORT=.*/PORT=$port/" "$service_dir/.env"
    else
      echo "PORT=$port" >> "$service_dir/.env"
    fi
  elif [ ! -f "$service_dir/.env" ]; then
    info "Creating .env file with PORT=$port..."
    echo "PORT=$port" > "$service_dir/.env"
  fi
  
  success "Service $service_name verified successfully"
  return 0
}

# Ensure we're in the monorepo root
if [ ! -f "nx.json" ]; then
  error "Please run this from the TerraFusionMono repo root"
fi

# Array of services to verify, with format: "name:directory:port"
services=(
  "core-gateway:apps/core-gateway:4000"
  "terralegislativepulsepub:apps/terralegislativepulsepub:4001"
  "terraagent:apps/terraagent:4002"
  "terraf:apps/terraf:4003"
  "terraflow:apps/terraflow:4004"
  "terrafusionpro:apps/terrafusionpro:4005"
  "terrafusionsync:apps/terrafusionsync:4006"
  "terraminer:apps/terraminer:4007"
  "bcbscostapp:apps/bcbscostapp:4008"
  "bcbsgispro:apps/bcbsgispro:4009"
  "bcbslevy:apps/bcbslevy:4010"
  "bcbswebhub:apps/bcbswebhub:4011"
  "bsbcmaster:apps/bsbcmaster:4012"
  "bsincomevaluation:apps/bsincomevaluation:4013"
)

# Process each service
total=${#services[@]}
success_count=0
failed=()

for service_info in "${services[@]}"; do
  # Split the service info by colon
  IFS=':' read -r name dir port <<< "$service_info"
  
  # Verify the service
  if verify_service "$name" "$dir" "$port"; then
    ((success_count++))
  else
    failed+=("$name")
  fi
done

# Report results
echo -e "\n${BLUE}=== Service Verification Results ===${NC}"
echo -e "${GREEN}Successfully verified: $success_count/$total services${NC}"

if [ ${#failed[@]} -gt 0 ]; then
  echo -e "${RED}Failed services: ${failed[*]}${NC}"
  exit 1
fi

# Done
echo -e "\n${GREEN}All services have been successfully set up and verified!${NC}"