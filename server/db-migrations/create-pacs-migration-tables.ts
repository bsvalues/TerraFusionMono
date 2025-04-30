import { db } from '../db';
import { 
  migrationStatusEnum, 
  sourceSystemEnum, 
  migrationTypeEnum
} from '../../shared/schema';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import { pool } from '../db';

export async function createPacsMigrationTables() {
  try {
    console.log('Creating PACS migration tables if not exists');

    // Step 1: Check and create the enum types if they don't exist
    const migrationStatusEnumExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'migration_status'
      );
    `);
    
    if (!migrationStatusEnumExists.rows[0].exists) {
      console.log('Creating migration_status enum');
      await db.execute(sql`
        CREATE TYPE migration_status AS ENUM (
          'pending', 'in_progress', 'completed', 'failed', 'cancelled'
        )
      `);
    }
    
    const sourceSystemEnumExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'source_system_type'
      );
    `);
    
    if (!sourceSystemEnumExists.rows[0].exists) {
      console.log('Creating source_system_type enum');
      await db.execute(sql`
        CREATE TYPE source_system_type AS ENUM (
          'pacs', 'cama', 'gis', 'other'
        )
      `);
    }
    
    const migrationTypeEnumExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'migration_type'
      );
    `);
    
    if (!migrationTypeEnumExists.rows[0].exists) {
      console.log('Creating migration_type enum');
      await db.execute(sql`
        CREATE TYPE migration_type AS ENUM (
          'full', 'incremental', 'delta', 'test'
        )
      `);
    }
    
    // Step 2: Check and create the PACS connections table
    const pacsConnectionsTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pacs_connections'
      );
    `);
    
    if (!pacsConnectionsTableExists.rows[0].exists) {
      console.log('Creating pacs_connections table');
      await db.execute(sql`
        CREATE TABLE pacs_connections (
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
        )
      `);
      
      console.log('Created pacs_connections table');
    } else {
      console.log('pacs_connections table already exists');
    }
    
    // Step 3: Check and create the migration jobs table
    const migrationJobsTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migration_jobs'
      );
    `);
    
    if (!migrationJobsTableExists.rows[0].exists) {
      console.log('Creating migration_jobs table');
      await db.execute(sql`
        CREATE TABLE migration_jobs (
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
        )
      `);
      
      console.log('Created migration_jobs table');
    } else {
      console.log('migration_jobs table already exists');
    }
    
    // Step 4: Check and create the schema mappings table
    const schemaMappingsTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_mappings'
      );
    `);
    
    if (!schemaMappingsTableExists.rows[0].exists) {
      console.log('Creating schema_mappings table');
      await db.execute(sql`
        CREATE TABLE schema_mappings (
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
        )
      `);
      
      console.log('Created schema_mappings table');
    } else {
      console.log('schema_mappings table already exists');
    }
    
    // Step 5: Check and create the migration executions table
    const migrationExecutionsTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migration_executions'
      );
    `);
    
    if (!migrationExecutionsTableExists.rows[0].exists) {
      console.log('Creating migration_executions table');
      await db.execute(sql`
        CREATE TABLE migration_executions (
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
        )
      `);
      
      console.log('Created migration_executions table');
    } else {
      console.log('migration_executions table already exists');
    }
    
    // Step 6: Check and create the transformation logs table
    const transformationLogsTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transformation_logs'
      );
    `);
    
    if (!transformationLogsTableExists.rows[0].exists) {
      console.log('Creating transformation_logs table');
      await db.execute(sql`
        CREATE TABLE transformation_logs (
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
        )
      `);
      
      console.log('Created transformation_logs table');
    } else {
      console.log('transformation_logs table already exists');
    }
    
    // Create useful indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS pacs_connections_status_idx ON pacs_connections (status)
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS migration_jobs_status_idx ON migration_jobs (status)
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS migration_jobs_connection_idx ON migration_jobs (connection_id)
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS schema_mappings_job_idx ON schema_mappings (job_id)
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS migration_executions_job_idx ON migration_executions (job_id)
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS migration_executions_status_idx ON migration_executions (status)
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS transformation_logs_execution_idx ON transformation_logs (execution_id)
    `);
    
    console.log('PACS migration tables and indexes created successfully');
    return true;
  } catch (error) {
    console.error('Error creating PACS migration tables:', error);
    return false;
  }
}