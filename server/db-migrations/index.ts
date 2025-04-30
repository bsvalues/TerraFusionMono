import { createNatsConnectionsTable } from './create-nats-connections';
import { createPacsMigrationTables } from './create-pacs-migration-tables';

export async function runMigrations() {
  console.log('Running database migrations...');
  
  // Run NATS connections table migration
  const natsResult = await createNatsConnectionsTable();
  
  if (natsResult) {
    console.log('NATS connections migration completed successfully');
  } else {
    console.error('NATS connections migration failed');
  }
  
  // Run PACS migration tables migration
  const pacsResult = await createPacsMigrationTables();
  
  if (pacsResult) {
    console.log('PACS migration tables migration completed successfully');
  } else {
    console.error('PACS migration tables migration failed');
  }
  
  console.log('All migrations completed');
  return true;
}