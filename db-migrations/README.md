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

3. **V3__index_optimizations.sql**
   - Adds optimized indexes for improved query performance
   - Adds compound indexes for common query patterns
   - Sets default values where needed

4. **V4__audit_columns.sql**
   - Adds audit tracking columns (created_at, updated_at, etc.)
   - Creates triggers to automatically update timestamps
   - Tracks who created and updated records

5. **V5__analysis_views.sql**
   - Creates database views for common analysis queries
   - Provides summary views for property valuation
   - Provides summary views for billing and payment information

## Running Migrations

To run the migrations, you need to have Flyway CLI installed. Then you can run:

```bash
cd db-migrations
flyway migrate
```

For a clean environment, you can run:

```bash
flyway clean  # Warning: This will delete all data!
flyway migrate
```

## Verification

To check the migration status, run:

```bash
flyway info
```

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