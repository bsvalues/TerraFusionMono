#!/bin/bash
# Load GIS sample data into the TerraFusion database

# Source environment variables if present
if [ -f .env ]; then
  source .env
fi

# Use environment variables if available, otherwise use defaults
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-postgres}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

echo "Loading sample GIS data into PostgreSQL database..."
echo "Using database: $DB_NAME on $DB_HOST:$DB_PORT"

# Execute the sample data loading script
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f db-migrations/scripts/load_sample_geometries.sql

if [ $? -eq 0 ]; then
  echo "Sample GIS data has been successfully loaded!"
  echo "You can now test the GIS functionality in the TerraFusion application."
else
  echo "Error: Failed to load sample GIS data."
  exit 1
fi