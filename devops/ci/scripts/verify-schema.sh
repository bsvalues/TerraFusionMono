#!/bin/bash
# Script to run advanced verification on the database schema after migrations

set -e

# Get database connection variables from environment
DB_HOST=${DB_URL#*://}
DB_HOST=${DB_HOST%%:*}
DB_PORT=${DB_URL#*:}
DB_PORT=${DB_PORT%%/*}
DB_PORT=${DB_PORT##*:}
DB_NAME=${DB_URL##*/}

echo "Verifying database schema integrity..."

# Check for expected schemas
echo "Checking for required schemas..."
schemas=$(PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "
  SELECT schema_name 
  FROM information_schema.schemata 
  WHERE schema_name IN ('appraisal', 'billing', 'master');
")

# Count number of schemas
schema_count=$(echo "$schemas" | grep -v '^\s*$' | wc -l)
if [ "$schema_count" -ne 3 ]; then
  echo "ERROR: Missing schemas. Expected 3, found $schema_count:"
  echo "$schemas"
  exit 1
else
  echo "✓ All required schemas found ($schema_count/3)"
fi

# Verify critical tables exist
echo "Checking for critical tables..."
CRITICAL_TABLES=(
  "appraisal.property"
  "appraisal.land_parcel" 
  "appraisal.improvement"
  "billing.levy"
  "billing.levy_bill"
  "billing.payment"
  "billing.special_assessment"
)

for table in "${CRITICAL_TABLES[@]}"; do
  schema=${table%.*}
  table_name=${table#*.}
  result=$(PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = '$schema' 
      AND table_name = '$table_name'
    );
  ")
  
  if [[ $result == *t* ]]; then
    echo "✓ Table $table exists"
  else
    echo "ERROR: Critical table $table is missing!"
    exit 1
  fi
done

# Verify cross-schema foreign keys
echo "Checking cross-schema foreign key constraints..."
fk_result=$(PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "
  SELECT count(*) 
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema != ccu.table_schema
  AND tc.table_schema IN ('appraisal', 'billing', 'master')
  AND ccu.table_schema IN ('appraisal', 'billing', 'master');
")

fk_count=$(echo "$fk_result" | tr -d ' ')
if [ "$fk_count" -gt 0 ]; then
  echo "✓ $fk_count cross-schema foreign key constraints found"
else
  echo "WARNING: No cross-schema foreign key constraints found. This might indicate a problem with schema reorganization."
fi

# Check for audit columns on critical tables
echo "Checking for audit columns on critical tables..."
PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "
  SELECT 
    table_schema,
    table_name,
    (SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = t.table_schema 
                   AND table_name = t.table_name 
                   AND column_name = 'created_at')) as has_created_at,
    (SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = t.table_schema 
                   AND table_name = t.table_name 
                   AND column_name = 'updated_at')) as has_updated_at
  FROM information_schema.tables t
  WHERE table_schema IN ('appraisal', 'billing', 'master')
    AND table_type = 'BASE TABLE'
    AND table_name IN ('property', 'land_parcel', 'improvement', 'levy_bill', 'special_assessment');
"

# Check for views in master schema
echo "Checking for analysis views..."
views=$(PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -t -c "
  SELECT table_name 
  FROM information_schema.views 
  WHERE table_schema = 'master';
")

view_count=$(echo "$views" | grep -v '^\s*$' | wc -l)
if [ "$view_count" -gt 0 ]; then
  echo "✓ Found $view_count views in the master schema:"
  echo "$views"
else
  echo "WARNING: No views found in master schema. Analysis views may be missing."
fi

echo "Schema verification completed successfully!"
exit 0