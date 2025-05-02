#!/bin/bash
# Script to run Flyway migrations

# Check if flyway command is available
if ! command -v flyway &> /dev/null; then
  echo "Error: Flyway is not installed or not in the PATH"
  exit 1
fi

# Generate temporary config to avoid exposing secrets in command line
TMP_CONFIG=$(mktemp)
cat > $TMP_CONFIG << EOF
flyway.url=jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}
flyway.user=${PGUSER}
flyway.password=${PGPASSWORD}
flyway.schemas=public
flyway.defaultSchema=public
flyway.locations=filesystem:./migrations
flyway.baselineOnMigrate=true
flyway.cleanDisabled=false
EOF

echo "Running Flyway migrations..."
# Run Flyway migration
flyway -configFiles=$TMP_CONFIG migrate

# Delete temporary config
rm $TMP_CONFIG

echo "Flyway migrations completed."