# Database Migration CI/CD Process

This document explains how database migrations are managed and deployed in the TerraFusion project using Flyway.

## Overview

TerraFusion uses Flyway to manage database schema migrations in a controlled, version-tracked manner. Our CI/CD pipeline automatically tests migrations on pull requests and deploys them to the appropriate environments when merged.

## Migration Files

Migration files are stored in the `db-migrations/migrations` directory and follow Flyway's naming convention:

```
V{version}__{description}.sql
```

For example:
- `V1__baseline.sql`
- `V2__schema_reorganization.sql`
- `V3__add_fks.sql`

## CI/CD Workflow

### Pull Request Validation

When a PR containing database migration changes is created:

1. The `flyway-migration.yml` workflow automatically runs
2. It spins up a PostgreSQL database container
3. Validates and applies migrations to test for errors
4. Verifies the resulting schema matches expectations
5. Reports success or failure in the PR status checks

This ensures migrations work correctly before they're merged.

### Deployment

When migrations are merged to the main branches:

1. The `flyway-deploy.yml` workflow automatically runs
2. For `develop` branch: Deploys to staging environment
3. For `main` branch: Deploys to production environment
4. Takes a database backup before applying changes
5. Applies the migrations using Flyway
6. Verifies migration success

Deployment can also be triggered manually for specific environments.

## Local Development

Developers can run migrations locally using the `run-local-migration.sh` script:

```bash
# Navigate to the migrations directory
cd db-migrations

# Apply migrations to local database
./run-local-migration.sh migrate

# Check migration status
./run-local-migration.sh info
```

The script uses environment variables for database connection:
- `PGHOST` - Database host (default: localhost)
- `PGPORT` - Database port (default: 5432)
- `PGUSER` - Database user (default: postgres)
- `PGPASSWORD` - Database password
- `PGDATABASE` - Database name (default: terradb)

## Best Practices

1. **Never modify existing migrations** that have been applied to any environment
2. **Always create new migration files** for schema changes
3. **Test migrations locally** before pushing to source control
4. **Make migrations idempotent** when possible (use IF EXISTS/IF NOT EXISTS)
5. **Include rollback procedures** in your PR description
6. **Avoid large transactions** that could lock tables for extended periods
7. **Track schema changes** in both migration files and the DBML documentation

## Troubleshooting

If migrations fail:

1. Check the GitHub Actions logs for detailed error messages
2. Run the failing migration locally with more verbose output:
   ```bash
   ./run-local-migration.sh validate
   ```
3. Make necessary corrections and push an update to your PR
4. For emergency fixes on production, contact the DBA team