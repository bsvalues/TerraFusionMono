#!/bin/bash

# Usage instructions:
# 1. Make this file executable: chmod +x run_dbt.sh
# 2. Run with: ./run_dbt.sh [command]
#    Available commands: deps, run, test, all
#    Default (no args): runs a dbt run

# Exit on errors
set -e

# Default command is 'run'
COMMAND=${1:-run}

# Set environment variables for database connection (if not already set)
export PGHOST=${PGHOST:-localhost}
export PGUSER=${PGUSER:-postgres}
export PGPASSWORD=${PGPASSWORD:-postgres}
export PGDATABASE=${PGDATABASE:-terradb}
export PGPORT=${PGPORT:-5432}

# Navigate to analytics directory
cd "$(dirname "$0")"

# Check if dbt is installed
if ! command -v dbt &> /dev/null; then
    echo "dbt is not installed. Please install it first."
    echo "You can install it with: pip install dbt-postgres"
    exit 1
fi

# Main function to run dbt commands
run_dbt() {
    case $COMMAND in
        deps)
            echo "Installing dbt dependencies..."
            dbt deps
            ;;
        run)
            echo "Running dbt models..."
            dbt run --profiles-dir .
            ;;
        test)
            echo "Running dbt tests..."
            dbt test --profiles-dir .
            ;;
        all)
            echo "Running full dbt workflow: deps, run, test..."
            dbt deps
            dbt run --profiles-dir .
            dbt test --profiles-dir .
            ;;
        *)
            echo "Unknown command: $COMMAND"
            echo "Available commands: deps, run, test, all"
            exit 1
            ;;
    esac
}

# Run the appropriate command
run_dbt

echo "dbt $COMMAND completed!"