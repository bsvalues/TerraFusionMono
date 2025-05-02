# Database Migrations

This directory contains the database migration scripts for the TerraFusion property assessment and taxation system.

## Structure

```
db-migrations/
├── config/
│   ├── flyway.dev.conf       # Development environment configuration
│   └── flyway.prod.conf      # Production environment configuration
├── migrations/
│   ├── V1__baseline.sql      # Baseline schema (initial state)
│   ├── V2__schema_reorganization.sql    # Reorganization into namespaces
│   ├── V3__add_fks.sql       # Addition of foreign key constraints
│   ├── V4__audit_columns.sql # Addition of audit columns
│   └── V5__analysis_views.sql # Analysis views for reporting
├── scripts/
│   ├── apply-migrations.sh   # Script to apply migrations
│   ├── info-migrations.sh    # Script to show migration status
│   └── rollback-migration.sh # Script to rollback latest migration
└── README.md                 # This file
```

## Using Flyway

### Prerequisites

- Flyway CLI installed (v9.x or later)
- PostgreSQL database connection credentials

### Configuration

Flyway configuration files are stored in the `config/` directory. You need to set the following environment variables or update the configuration files:

- `FLYWAY_URL` - JDBC URL to the database
- `FLYWAY_USER` - Database user
- `FLYWAY_PASSWORD` - Database password
- `FLYWAY_SCHEMAS` - Comma-separated list of schemas to manage (public,appraisal,billing,master)
- `FLYWAY_LOCATIONS` - Location of migration files

### Basic Commands

**View Migration Status:**
```bash
flyway -configFiles=config/flyway.dev.conf info
```

**Apply Migrations:**
```bash
flyway -configFiles=config/flyway.dev.conf migrate
```

**Rollback Latest Migration:**
```bash
flyway -configFiles=config/flyway.dev.conf undo
```

## CI/CD Integration

The repository includes GitHub Actions workflows to:

1. **Validate Migrations** - Checks that migrations can be applied cleanly
2. **Deploy Migrations** - Applies migrations to the target environment
3. **Rollback Smoke Test** - Tests that the latest migration can be safely rolled back

See the [Database Migrations Runbook](../docs/runbooks/db-migrations.md) for detailed procedures on handling migrations in production environments.

## Migration Standards

When creating new migrations, follow these guidelines:

1. Version files sequentially (V6, V7, etc.)
2. Use descriptive names that clearly indicate the purpose
3. Include transactional boundaries (`BEGIN`/`COMMIT` blocks)
4. For each migration, ensure an "undo" migration is possible
5. Keep migrations atomic (focused on a single, coherent change)
6. Test both forward and backward migrations before submitting
7. Document any manual steps required for production deployments

## Schema Namespaces

The database is organized into the following namespaces:

- `appraisal` - Property valuation and assessment tables
- `billing` - Tax levy and payment processing tables
- `master` - Shared lookup tables and configuration

## Contact

For questions or assistance with database migrations, contact:
- Database Team: db-team@terrafusion.local