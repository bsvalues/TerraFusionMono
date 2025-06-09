#!/bin/bash
# Script to run Flyway migrations for TerraFusion
# Usage: ./run-migrations.sh [command] [options]
# Commands: migrate, clean, info, validate, repair, baseline

set -e

# Default command is 'info' if not specified
COMMAND=${1:-info}
shift || true

# Check if Flyway is installed
if ! command -v flyway &> /dev/null; then
    echo "Error: Flyway is not installed or not in PATH"
    echo "Please install Flyway: https://flywaydb.org/documentation/usage/commandline/"
    exit 1
fi

# Check for config file
if [ ! -f "flyway.conf" ]; then
    echo "Error: flyway.conf not found in current directory"
    echo "Please run this script from the db-migrations directory"
    exit 1
fi

# Check for migrations directory
if [ ! -d "migrations" ]; then
    echo "Error: migrations directory not found"
    echo "Please run this script from the db-migrations directory"
    exit 1
fi

# Main logic
case "$COMMAND" in
    migrate|clean|info|validate|repair|baseline)
        echo "Running flyway $COMMAND..."
        flyway -configFiles=flyway.conf "$COMMAND" "$@"
        ;;
    sample)
        echo "Loading sample data..."
        
        # Check if psql is installed
        if ! command -v psql &> /dev/null; then
            echo "Error: psql is not installed or not in PATH"
            echo "Please install PostgreSQL client tools"
            exit 1
        fi
        
        # Get database connection details from flyway.conf
        DB_URL=$(grep "flyway.url" flyway.conf | cut -d '=' -f 2-)
        DB_USER=$(grep "flyway.user" flyway.conf | cut -d '=' -f 2-)
        DB_PASS=$(grep "flyway.password" flyway.conf | cut -d '=' -f 2-)
        
        # Extract hostname, port, and database name from JDBC URL
        DB_HOST=$(echo "$DB_URL" | sed -n 's/.*:\/\/\([^:]*\).*/\1/p')
        DB_PORT=$(echo "$DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        DB_NAME=$(echo "$DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        
        # Run the sample data script
        export PGPASSWORD="$DB_PASS"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "scripts/load_sample_geometries.sql"
        unset PGPASSWORD
        ;;
    *)
        echo "Unknown command: $COMMAND"
        echo "Usage: ./run-migrations.sh [command] [options]"
        echo "Commands: migrate, clean, info, validate, repair, baseline, sample"
        exit 1
        ;;
esac

echo "Done!"
exit 0