# Database Migration Guidelines

This document provides guidelines for writing and maintaining database migrations in the TerraFusion project.

## Migration Design Principles

1. **Idempotent Migrations**: Always write migrations that can be run multiple times without causing errors
2. **Small Focused Changes**: Keep migrations focused on a specific change to minimize risk
3. **Backward Compatibility**: Avoid breaking changes to existing applications
4. **Explicit Over Implicit**: Explicitly name constraints, indexes, and other database objects
5. **Atomic Operations**: Group related changes in a single migration
6. **Transaction Safety**: Ensure migrations can be safely run within a transaction
7. **Documentation**: Include comments explaining the purpose of complex changes

## Naming Conventions

### Schema Objects

- Tables: Singular nouns, lowercase with underscores (e.g., `property`, `land_parcel`)
- Columns: Lowercase with underscores (e.g., `property_id`, `assessment_value`)
- Primary Keys: Table name with `_id` suffix (e.g., `property_id`)
- Foreign Keys: Referenced table + column (e.g., `fk_land_parcel_property`)
- Indexes: Prefix with `idx_` + table + columns (e.g., `idx_property_type_code`)
- Schemas: Lowercase, singular (e.g., `appraisal`, `billing`, `master`)

### Migration Files

Migration files follow Flyway's naming convention:

```
V{version}__{description}.sql
```

- Version: Sequential number (e.g., `1`, `2`, `3`)
- Description: Lowercase with underscores (e.g., `schema_reorganization`, `add_indexes`)

## Migration Templates

### Create Table

```sql
CREATE TABLE IF NOT EXISTS schema_name.table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    column_name DATA_TYPE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add comments
COMMENT ON TABLE schema_name.table_name IS 'Description of the table';
COMMENT ON COLUMN schema_name.table_name.column_name IS 'Description of the column';
```

### Alter Table

```sql
-- Add a new column
ALTER TABLE schema_name.table_name
ADD COLUMN IF NOT EXISTS column_name DATA_TYPE;

-- Modify a column
ALTER TABLE schema_name.table_name
ALTER COLUMN column_name TYPE new_data_type;

-- Add a foreign key
ALTER TABLE schema_name.table_name
ADD CONSTRAINT fk_name FOREIGN KEY (column_name) 
REFERENCES other_schema.other_table(id);
```

### Create Index

```sql
-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_name 
ON schema_name.table_name (column_name);

-- Create a compound index
CREATE INDEX IF NOT EXISTS idx_name 
ON schema_name.table_name (column1, column2);
```

### Data Migration

```sql
-- Update data with safety check
UPDATE schema_name.table_name
SET column_name = 'new_value'
WHERE column_name = 'old_value'
  AND id IN (SELECT id FROM schema_name.table_name WHERE specific_condition);
```

### Schema Transfer (PostgreSQL)

```sql
-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS new_schema;

-- Move a table from one schema to another
ALTER TABLE old_schema.table_name SET SCHEMA new_schema;
```

## Best Practices

### DO

- Use `IF EXISTS` / `IF NOT EXISTS` conditionals
- Include comments for complex migrations
- Test migrations on a copy of production data
- Handle NULL values explicitly
- Limit the scope of each migration
- Use explicit schema references in all queries
- Write rollback procedures in PR descriptions

### DON'T

- Modify or delete existing migrations
- Use hardcoded UUIDs or timestamps
- Run migrations directly in production
- Use proprietary database features if avoidable
- Mix DDL and large data changes in one migration
- Create database-specific functions without documentation

## Performance Considerations

1. **Indexes**: Add appropriate indexes, but be cautious about adding too many
2. **Large Tables**: For large tables, consider batched operations
3. **Locking**: Be aware of table locks during schema changes
4. **Transactions**: Use transactions appropriately
5. **Maintenance Windows**: Schedule disruptive migrations during maintenance windows

## QA Process

1. Run the migration in a development environment
2. Verify the schema matches expectations
3. Create automated tests for new database functionality
4. Submit a PR with detailed description and rollback plan
5. Request review from a database administrator
6. Apply to staging after approval
7. Monitor database performance after deployment

## Troubleshooting

If migrations fail:

1. Check Flyway logs for detailed error messages
2. Verify database credentials and connectivity
3. Ensure the migration is idempotent
4. Check for syntax errors in SQL statements
5. Verify that referenced objects exist
6. Check for data constraint violations

For more information, see the [CI/CD Documentation](../devops/ci/README.md) for automated testing and deployment of migrations.