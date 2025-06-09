#!/bin/bash
# Script to run Flyway migrations locally for development
# Usage: ./run-local-migration.sh [command]
# Available commands: migrate, info, validate, clean, baseline, repair

set -e

# Default command is 'info' if not specified
COMMAND=${1:-info}
VALID_COMMANDS=("migrate" "info" "validate" "clean" "baseline" "repair")

# Check if command is valid
if [[ ! " ${VALID_COMMANDS[@]} " =~ " ${COMMAND} " ]]; then
    echo "Error: Invalid command '${COMMAND}'"
    echo "Available commands: ${VALID_COMMANDS[*]}"
    exit 1
fi

# Check if environment variables are set
if [ -z "$PGHOST" ] || [ -z "$PGPORT" ] || [ -z "$PGUSER" ] || [ -z "$PGPASSWORD" ] || [ -z "$PGDATABASE" ]; then
    echo "Environment variables not set. Please set the following:"
    echo "  PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE"
    
    # Set defaults for local development if .env file exists
    if [ -f ../.env ]; then
        echo "Loading environment from ../.env file"
        export $(grep -v '^#' ../.env | xargs)
    else
        echo "No .env file found. Using default connection values..."
        export PGHOST=localhost
        export PGPORT=5432
        export PGUSER=postgres
        export PGPASSWORD=postgres
        export PGDATABASE=terradb
    fi
    
    echo "Using database connection:"
    echo "  Host: $PGHOST"
    echo "  Port: $PGPORT"
    echo "  User: $PGUSER"
    echo "  Database: $PGDATABASE"
fi

# Warn about dangerous commands
if [ "$COMMAND" == "clean" ]; then
    echo "WARNING: 'clean' command will remove ALL objects in the schema!"
    read -p "Are you sure you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operation cancelled."
        exit 0
    fi
fi

# Check if Flyway is available
if ! command -v flyway &> /dev/null; then
    echo "Flyway not found in PATH. Do you want to download it? (y/n)"
    read -p "> " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Downloading Flyway..."
        TEMP_DIR=$(mktemp -d)
        cd $TEMP_DIR
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            wget -qO- https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/9.20.0/flyway-commandline-9.20.0-macosx-x64.tar.gz | tar xvz
        else
            # Linux
            wget -qO- https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/9.20.0/flyway-commandline-9.20.0-linux-x64.tar.gz | tar xvz
        fi
        
        echo "Adding Flyway to PATH for this session..."
        export PATH=$PATH:$TEMP_DIR/flyway-9.20.0
        cd - > /dev/null
    else
        echo "Please install Flyway CLI and try again."
        echo "Visit: https://flywaydb.org/download/community"
        exit 1
    fi
fi

# Execute Flyway command
echo "Executing: flyway $COMMAND"

# Generate temporary config to avoid exposing secrets in command line
TMP_CONFIG=$(mktemp)
cat > $TMP_CONFIG << EOF
flyway.url=jdbc:postgresql://$PGHOST:$PGPORT/$PGDATABASE
flyway.user=$PGUSER
flyway.password=$PGPASSWORD
flyway.schemas=appraisal,billing,master
flyway.defaultSchema=public
flyway.locations=filesystem:./migrations
flyway.baselineOnMigrate=true
flyway.cleanDisabled=false
EOF

# Run Flyway command
flyway -configFiles=$TMP_CONFIG $COMMAND

# Delete temporary config
rm $TMP_CONFIG

echo "Flyway $COMMAND completed."