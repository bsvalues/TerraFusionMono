#!/bin/bash
# Script to run migrations and verify database schema in CI/CD pipeline

set -e

# Default values
DB_URL=${DB_URL:-"jdbc:postgresql://postgres:5432/test_database"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"postgres"}
COMMAND=${1:-"migrate"}

# Generate Flyway config
cat > flyway.conf << EOF
flyway.url=${DB_URL}
flyway.user=${DB_USER}
flyway.password=${DB_PASSWORD}
flyway.schemas=appraisal,billing,master
flyway.defaultSchema=public
flyway.locations=filesystem:/migrations
flyway.baselineOnMigrate=true
flyway.cleanDisabled=false
EOF

echo "======= Flyway Configuration ======="
cat flyway.conf | grep -v password
echo "==================================="

# Run Flyway command
echo "Running: flyway $COMMAND"
flyway $COMMAND

# If migrate command, verify schema
if [ "$COMMAND" = "migrate" ]; then
  echo "Migration complete. Verifying schema..."
  
  # Show Flyway info
  flyway info
  
  # Run schema verification
  if [ -f "/verify-schema.sh" ]; then
    echo "Running schema verification..."
    /verify-schema.sh
  else
    echo "Schema verification script not found. Skipping."
  fi
  
  # Count tables in each schema
  echo "Table counts by schema:"
  PGPASSWORD=${DB_PASSWORD} psql -h ${DB_URL#*://} -U ${DB_USER} -d ${DB_URL##*/} -c "
  SELECT 
    table_schema,
    COUNT(*) as table_count
  FROM 
    information_schema.tables
  WHERE 
    table_schema IN ('appraisal', 'billing', 'master')
    AND table_type = 'BASE TABLE'
  GROUP BY 
    table_schema
  ORDER BY
    table_schema;
  "
  
  # Verify foreign key constraints
  echo "Foreign key constraints:"
  PGPASSWORD=${DB_PASSWORD} psql -h ${DB_URL#*://} -U ${DB_USER} -d ${DB_URL##*/} -c "
  SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
  FROM 
    information_schema.table_constraints AS tc 
  JOIN 
    information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN 
    information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE 
    tc.constraint_type = 'FOREIGN KEY' AND
    tc.table_schema IN ('appraisal', 'billing', 'master');
  "
fi

echo "Flyway $COMMAND operation completed successfully."