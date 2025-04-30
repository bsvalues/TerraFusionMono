import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import { db } from '../db';
import {
  migrationStatusEnum,
  sourceSystemEnum,
  migrationTypeEnum,
  pacsConnections,
  migrationJobs,
  migrationExecutions,
  schemaMappings,
  transformationLogs
} from '@shared/schema';

export async function createPacsMigrationTables(pool: Pool) {
  console.log('Creating PACS migration tables if not exists');

  try {
    // Step 1: Create the PACS migration enum types if they don't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'migration_status') THEN
          CREATE TYPE migration_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'cancelled');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'source_system_type') THEN
          CREATE TYPE source_system_type AS ENUM ('pacs', 'cama', 'gis', 'other');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'migration_type') THEN
          CREATE TYPE migration_type AS ENUM ('full', 'incremental', 'delta', 'test');
        END IF;
      END
      $$;
    `);

    // Step 2: Create the PACS connections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pacs_connections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        host VARCHAR(255),
        port INTEGER,
        username VARCHAR(255),
        password VARCHAR(255),
        database VARCHAR(255),
        api_key VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        description TEXT,
        test_status VARCHAR(50) DEFAULT 'pending',
        source_system source_system_type NOT NULL DEFAULT 'pacs',
        created_by INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_test_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // Step 3: Create the migration jobs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migration_jobs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        connection_id INTEGER REFERENCES pacs_connections(id) ON DELETE CASCADE,
        status migration_status DEFAULT 'pending',
        source_system source_system_type NOT NULL DEFAULT 'pacs',
        migration_type migration_type DEFAULT 'full',
        schedule VARCHAR(255),
        last_run TIMESTAMP WITH TIME ZONE,
        next_run TIMESTAMP WITH TIME ZONE,
        created_by INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        config JSONB
      );
    `);

    // Step 4: Create the schema mappings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_mappings (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        job_id INTEGER REFERENCES migration_jobs(id) ON DELETE CASCADE,
        source_table VARCHAR(255) NOT NULL,
        target_table VARCHAR(255) NOT NULL,
        mapping_rules JSONB NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        priority INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        validation_rules JSONB,
        transformation_rules JSONB
      );
    `);

    // Step 5: Create the migration executions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migration_executions (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES migration_jobs(id) ON DELETE CASCADE,
        status migration_status DEFAULT 'pending',
        start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP WITH TIME ZONE,
        processed_records INTEGER DEFAULT 0,
        success_records INTEGER DEFAULT 0,
        failed_records INTEGER DEFAULT 0,
        run_by INTEGER,
        notes TEXT,
        error_details TEXT,
        execution_summary JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Step 6: Create the transformation logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transformation_logs (
        id SERIAL PRIMARY KEY,
        execution_id INTEGER REFERENCES migration_executions(id) ON DELETE CASCADE,
        source_table VARCHAR(255) NOT NULL,
        source_record_id VARCHAR(255) NOT NULL,
        target_table VARCHAR(255) NOT NULL,
        target_record_id VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        message TEXT,
        transformation_details JSONB,
        validation_details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('PACS migration tables created successfully');
    return true;
  } catch (error) {
    console.error('Error creating PACS migration tables:', error);
    throw error;
  }
}