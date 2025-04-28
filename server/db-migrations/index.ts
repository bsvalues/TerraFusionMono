import { createNatsConnectionsTable } from './create-nats-connections';

export async function runMigrations() {
  console.log('Running database migrations...');
  
  // Run NATS connections table migration
  const natsResult = await createNatsConnectionsTable();
  
  if (natsResult) {
    console.log('NATS connections migration completed successfully');
  } else {
    console.error('NATS connections migration failed');
  }
  
  console.log('All migrations completed');
  return true;
}