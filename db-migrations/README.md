# TerraFusion Database Migrations

This directory contains database migration scripts for the TerraFusion property assessment and taxation system.

## Migration Framework

We use Flyway as our database migration framework. Flyway tracks migration versions and ensures that migrations are applied in the correct order.

## Configuration

The `flyway.conf` file contains the configuration for Flyway. It reads database credentials from environment variables.

## Migration Script Overview

1. **V1__baseline.sql**
   - Establishes a baseline for the database
   - Creates schema namespaces: appraisal, billing, master

2. **V2__schema_reorganization.sql**
   - Reorganizes tables into logical schema namespaces
   - Moves property-related tables to the appraisal schema
   - Moves billing-related tables to the billing schema

3. **V3__add_fks.sql**
   - Adds explicit foreign key constraints across schemas
   - Ensures data integrity between related tables

4. **V4__index_optimizations.sql**
   - Adds optimized indexes for improved query performance
   - Adds compound indexes for common query patterns
   - Sets default values where needed

5. **V5__audit_columns.sql**
   - Adds audit tracking columns (created_at, updated_at, etc.)
   - Creates triggers to automatically update timestamps
   - Tracks who created and updated records

6. **V6__analysis_views.sql**
   - Creates database views for common analysis queries
   - Provides summary views for property valuation
   - Provides summary views for billing and payment information

## Running Migrations Locally

We provide a convenient script for running Flyway commands locally:

```bash
./run-local-migration.sh [command]
```

Available commands:
- `migrate` - Apply pending migrations
- `info` - Show migration status
- `validate` - Validate applied migrations
- `clean` - Remove all objects (warning: destroys data!)
- `baseline` - Baseline an existing database
- `repair` - Repair the metadata table

## CI/CD Integration

Database migrations are integrated with our CI/CD pipeline:

1. **Pull Request Validation**: Migrations are automatically tested on PRs
2. **Automated Deployment**: Migrations are deployed to staging/production on merge
3. **Rollback Protection**: Backups are taken before applying migrations

For more details, see the [CI/CD Documentation](../devops/ci/README.md).

## Schema Overview

### Appraisal Schema
Contains tables related to property characteristics and valuation:
- property
- land_parcel
- improvement

### Billing Schema
Contains tables related to taxes, bills, and payments:
- levy
- levy_bill
- payment
- collection_transaction 
- special_assessment

### Master Schema
Contains integration views that bring together all aspects of a property:
- property_comprehensive (view)

## Best Practices

1. **Never modify existing migrations** that have been applied to any environment
2. **Always create new migration files** for schema changes
3. **Test migrations locally** before pushing to source control
4. **Make migrations idempotent** when possible (use IF EXISTS/IF NOT EXISTS)
5. **Keep migrations small and focused** to minimize deployment risk