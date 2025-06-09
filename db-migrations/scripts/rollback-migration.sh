#!/bin/bash

# Rollback Flyway Migration Script
# Usage: ./rollback-migration.sh [environment]
# Example: ./rollback-migration.sh dev

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
echo "      Rollback Flyway Migration - $ENV Environment"
echo "====================================================================="

# Display current migration status
echo "Current migration status:"
flyway -configFiles="$CONFIG_FILE" info

# Check if there's at least one migration to roll back
MIGRATION_COUNT=$(flyway -configFiles="$CONFIG_FILE" info -table | grep -c "Success")
if [ "$MIGRATION_COUNT" -lt 1 ]; then
  echo "Error: No successful migrations found to roll back."
  exit 1
fi

echo ""
echo "WARNING: This will roll back the latest migration."
echo "This operation should NOT be performed on production without proper planning."
echo ""

# Prompt for confirmation before proceeding
read -p "Do you want to proceed with rollback? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Rollback aborted by user."
  exit 0
fi

# Apply rollback
echo "Rolling back the latest migration..."
flyway -configFiles="$CONFIG_FILE" undo

# Show the updated migration status
echo "Rollback completed. Updated status:"
flyway -configFiles="$CONFIG_FILE" info

echo "====================================================================="
echo "                     Rollback Complete"
echo "====================================================================="