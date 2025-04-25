#!/usr/bin/env bash
set -euo pipefail

# Start the core-gateway service with appropriate environment variables
echo "🚀 Starting Apollo Federation Gateway..."

# Use nx to start the core-gateway service
nx serve core-gateway

# This will start the gateway and connect to all configured subgraphs
# The gateway will be available at http://localhost:4000/graphql
# Health checks will be available at:
#   - http://localhost:4000/health/live
#   - http://localhost:4000/health/ready