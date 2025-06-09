#!/bin/bash

# Show Flyway Migration Status Script
# Usage: ./info-migrations.sh [environment]
# Example: ./info-migrations.sh dev

# Get the absolute path of the directory containing this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Navigate to the parent directory (db-migrations)
cd "$SCRIPT_DIR/.."

# Default to dev environment if not specified
ENV=${1:-dev}
CONFIG_FILE="config/flyway.$ENV.conf"

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: Configuration file '$CONFIG_FILE' not found."
  echo "Available environments:"
  ls -1 config/flyway.*.conf | sed 's/config\/flyway\.\(.*\)\.conf/- \1/'
  exit 1
fi

echo "====================================================================="
echo "      Checking Flyway Migration Status - $ENV Environment"
echo "====================================================================="

# Display detailed migration information
flyway -configFiles="$CONFIG_FILE" info

echo "====================================================================="