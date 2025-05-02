# Database Schema Documentation

This directory contains documentation for the TerraFusion database schema, focused on the property assessment and taxation system.

## Overview

The database is organized into logical namespaces to improve maintainability and better reflect the business domains:

- **Appraisal Schema**: Contains tables related to property characteristics and valuation
- **Billing Schema**: Contains tables related to taxes, bills, and payments
- **Master Schema**: Contains integration views across schemas

## Documentation Files

- [Schema DBML](./schema.dbml) - Complete database schema in DBML format
- [Data Dictionary](./DATA_DICTIONARY.md) - Detailed descriptions of tables and columns
- [Critical Tables](./CRITICAL_TABLES.md) - Analysis of the most important tables
- [Migration Guidelines](./MIGRATION_GUIDELINES.md) - Best practices for database migrations

## Schema Visualization

The DBML file can be imported into [dbdiagram.io](https://dbdiagram.io) to visualize the database schema and relationships.

## Migration System

The database uses [Flyway](https://flywaydb.org/) for schema migrations. Migration files are stored in the `db-migrations/migrations` directory and follow Flyway's naming convention:

```
V{version}__{description}.sql
```

See the [Database Migrations README](../../db-migrations/README.md) for more information on the migration system.

## Key Tables

### Appraisal Schema
- `property` - Core property record with identifiers and metadata
- `land_parcel` - Land parcels associated with properties
- `improvement` - Buildings and other structures on properties

### Billing Schema
- `levy` - Tax levy information
- `levy_bill` - Property tax bill records
- `payment` - Payment records for levy bills
- `special_assessment` - Special assessments for properties

### Master Schema
- `property_comprehensive` (view) - Integrated view of property information

## Database Design Principles

1. **Logical separation** of concerns through schema namespaces
2. **Foreign key constraints** to maintain data integrity
3. **Audit columns** to track changes over time
4. **Optimized indexes** for common query patterns
5. **Integration views** for reporting and analysis

## Contributing

When making changes to the database schema:

1. Update the DBML file to reflect new tables, columns, or relationships
2. Update the data dictionary with descriptions of new elements
3. Create migration scripts following the [Migration Guidelines](./MIGRATION_GUIDELINES.md)
4. Submit a PR for review

## Tools

- [dbdiagram.io](https://dbdiagram.io) - Create and visualize database schema diagrams
- [Flyway](https://flywaydb.org/) - Database migration framework
- [GitHub Actions](../../devops/ci/README.md) - CI/CD pipeline for database migrations