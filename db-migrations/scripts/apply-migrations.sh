#!/bin/bash

# Apply Flyway Migrations Script
# Usage: ./apply-migrations.sh [environment]
# Example: ./apply-migrations.sh dev

set -e  # Exit on error

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
echo "      Applying Flyway Migrations - $ENV Environment"
echo "====================================================================="

# Display current migration status
echo "Current migration status:"
flyway -configFiles="$CONFIG_FILE" info

# Prompt for confirmation before proceeding
read -p "Do you want to apply migrations? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted by user."
  exit 0
fi

# Apply migrations
echo "Applying migrations..."
flyway -configFiles="$CONFIG_FILE" migrate

# Show the updated migration status
echo "Migration completed. Updated status:"
flyway -configFiles="$CONFIG_FILE" info

echo "====================================================================="
echo "                     Migration Complete"
echo "====================================================================="