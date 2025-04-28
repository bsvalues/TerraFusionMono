import { db } from '../db';
import { natsConnections, natsConnectionsEnum } from '../../shared/schema';
import { sql } from 'drizzle-orm';

export async function createNatsConnectionsTable() {
  try {
    console.log('Creating NATS connections table if not exists');
    
    // First check if the enum type exists
    const enumExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'nats_connection_status'
      );
    `);
    
    if (!enumExists.rows[0].exists) {
      console.log('Creating nats_connection_status enum');
      await db.execute(sql`
        CREATE TYPE nats_connection_status AS ENUM (
          'connected', 'disconnected', 'error', 'reconnecting'
        )
      `);
    }
    
    // Check if the table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'nats_connections'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('Creating nats_connections table');
      
      await db.execute(sql`
        CREATE TABLE nats_connections (
          id SERIAL PRIMARY KEY,
          connection_id TEXT NOT NULL UNIQUE,
          service_name TEXT NOT NULL,
          status nats_connection_status NOT NULL DEFAULT 'disconnected',
          connection_info JSONB,
          connection_time TIMESTAMP NOT NULL DEFAULT NOW(),
          last_activity TIMESTAMP NOT NULL DEFAULT NOW(),
          last_ping_time TIMESTAMP NOT NULL DEFAULT NOW(),
          disconnection_time TIMESTAMP,
          reconnect_count INTEGER DEFAULT 0,
          messages_sent INTEGER DEFAULT 0,
          messages_received INTEGER DEFAULT 0,
          subscriptions JSONB,
          disconnection_reason TEXT
        )
      `);
      
      // Create indexes for better performance
      await db.execute(sql`
        CREATE INDEX nats_connections_service_idx ON nats_connections (service_name)
      `);
      
      await db.execute(sql`
        CREATE INDEX nats_connections_status_idx ON nats_connections (status)
      `);
      
      await db.execute(sql`
        CREATE INDEX nats_connections_activity_idx ON nats_connections (last_activity)
      `);
      
      console.log('NATS connections table created successfully');
    } else {
      console.log('NATS connections table already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error creating NATS connections table:', error);
    return false;
  }
}