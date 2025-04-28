#!/usr/bin/env bash
set -euo pipefail

# TerraFusion Smoke Tests Script
# This script runs smoke tests for all services to verify basic functionality
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

# Function to test an HTTP endpoint
test_endpoint() {
  local name=$1
  local url=$2
  local expected_status=${3:-200}
  local timeout=${4:-5}
  
  echo -e "\n${BLUE}Testing $name at $url${NC}"
  info "Expected status: $expected_status"
  
  # Try to connect with timeout
  response=$(curl -s -o response.txt -w "%{http_code}" --max-time $timeout "$url" || echo "000")
  
  if [ "$response" = "000" ]; then
    echo -e "${RED}Failed to connect to $url (timeout or connection refused)${NC}"
    return 1
  fi
  
  # Check status code
  if [ "$response" = "$expected_status" ]; then
    success "Received expected status code: $response"
    
    # For successful responses, check the response body if it exists
    if [ -s response.txt ]; then
      if grep -q "error" response.txt; then
        echo -e "${YELLOW}Warning: Response contains 'error' keyword${NC}"
        cat response.txt
      else
        success "Response body looks good"
      fi
    fi
    
    return 0
  else
    echo -e "${RED}Unexpected status code: $response (expected $expected_status)${NC}"
    if [ -s response.txt ]; then
      echo -e "${RED}Response body:${NC}"
      cat response.txt
    fi
    return 1
  fi
}

# Function to test a GraphQL endpoint
test_graphql() {
  local name=$1
  local url=$2
  local query=$3
  local timeout=${4:-5}
  
  echo -e "\n${BLUE}Testing GraphQL service: $name at $url${NC}"
  
  # Create a JSON file with the GraphQL query
  cat > query.json << EOF
{
  "query": "$query"
}
EOF
  
  # Try to connect with timeout
  response=$(curl -s -o response.txt -w "%{http_code}" -H "Content-Type: application/json" -d @query.json --max-time $timeout "$url" || echo "000")
  
  if [ "$response" = "000" ]; then
    echo -e "${RED}Failed to connect to $url (timeout or connection refused)${NC}"
    return 1
  fi
  
  # Check status code
  if [ "$response" = "200" ]; then
    success "Received status code 200"
    
    # Check for errors in the GraphQL response
    if grep -q "errors" response.txt; then
      echo -e "${RED}GraphQL response contains errors:${NC}"
      cat response.txt
      return 1
    else
      success "GraphQL query executed successfully"
      return 0
    fi
  else
    echo -e "${RED}Unexpected status code: $response (expected 200)${NC}"
    if [ -s response.txt ]; then
      echo -e "${RED}Response body:${NC}"
      cat response.txt
    fi
    return 1
  fi
}

# Function to run a smoke test for a specific service
run_service_test() {
  local name=$1
  local base_url=$2
  local type=$3
  
  echo -e "\n${BLUE}=== Running smoke test for $name ===${NC}"
  
  # Test service health endpoint
  if ! test_endpoint "$name health" "$base_url/health" 200 5; then
    return 1
  fi
  
  # Type-specific tests
  case "$type" in
    "graphql")
      # Simple introspection query for GraphQL services
      if ! test_graphql "$name" "$base_url/graphql" "{ __schema { queryType { name } } }" 5; then
        return 1
      fi
      ;;
    "rest")
      # For REST services, just check if the API endpoint responds
      if ! test_endpoint "$name API" "$base_url/api" 200 5; then
        return 1
      fi
      ;;
    *)
      # Default test for other service types
      success "Basic health check passed"
      ;;
  esac
  
  success "$name service smoke test passed"
  return 0
}

# Function to test the gateway
test_gateway() {
  echo -e "\n${BLUE}=== Testing Apollo Federation Gateway ===${NC}"
  
  # Test gateway health endpoints
  if ! test_endpoint "Gateway liveness" "http://localhost:4000/health/live" 200 5; then
    return 1
  fi
  
  if ! test_endpoint "Gateway readiness" "http://localhost:4000/health/ready" 200 5; then
    return 1
  fi
  
  # Test gateway GraphQL endpoint with a simple query
  if ! test_graphql "Gateway" "http://localhost:4000/graphql" "{ __schema { queryType { name } } }" 5; then
    return 1
  fi
  
  success "Gateway tests passed"
  return 0
}

# Ensure we're in the monorepo root
if [ ! -f "nx.json" ]; then
  error "Please run this from the TerraFusionMono repo root"
fi

# Define the services to test
# Format: "name:url:type" where type is "graphql", "rest", or "other"
services=(
  "terralegislativepulsepub:http://localhost:4001:graphql"
  "terraagent:http://localhost:4002:graphql"
  "terraf:http://localhost:4003:graphql"
  "terraflow:http://localhost:4004:graphql"
  "terrafusionpro:http://localhost:4005:graphql"
  "terrafusionsync:http://localhost:4006:graphql"
  "terraminer:http://localhost:4007:graphql"
  "bcbscostapp:http://localhost:4008:rest"
  "bcbsgispro:http://localhost:4009:rest"
  "bcbslevy:http://localhost:4010:rest"
  "bcbswebhub:http://localhost:4011:rest"
  "bsbcmaster:http://localhost:4012:rest"
  "bsincomevaluation:http://localhost:4013:rest"
)

# Initialize counters
total=${#services[@]}
success_count=0
failed=()

# Test the gateway
info "Testing the Apollo Federation Gateway..."
if test_gateway; then
  info "Gateway smoke tests passed"
else
  error "Gateway smoke tests failed"
fi

# Test each service
for service_info in "${services[@]}"; do
  # Split the service info by colon
  IFS=':' read -r name url type <<< "$service_info"
  
  # Run the service test
  if run_service_test "$name" "$url" "$type"; then
    ((success_count++))
  else
    failed+=("$name")
  fi
done

# Clean up temporary files
rm -f response.txt query.json

# Report results
echo -e "\n${BLUE}=== Smoke Test Results ===${NC}"
echo -e "${GREEN}Successfully tested: $success_count/$total services${NC}"

if [ ${#failed[@]} -gt 0 ]; then
  echo -e "${RED}Failed services: ${failed[*]}${NC}"
  echo -e "${YELLOW}Please check the logs above for specific errors${NC}"
  exit 1
fi

# Done
echo -e "\n${GREEN}All smoke tests passed successfully!${NC}"