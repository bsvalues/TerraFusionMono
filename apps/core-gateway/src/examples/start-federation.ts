import { startServer as startGateway } from '../main';
import { startServer as startBackendSubgraph } from './mock-backend-subgraph';
import { startServer as startGisHubSubgraph } from './mock-gishub-subgraph';
import { startServer as startLevyCalcSubgraph } from './mock-levycalc-subgraph';

/**
 * Start all federation components
 */
async function startFederation() {
  try {
    // Start the subgraphs
    console.log('Starting subgraph services...');
    
    // Start all subgraphs in parallel
    await Promise.all([
      startBackendSubgraph(),
      startGisHubSubgraph(),
      startLevyCalcSubgraph()
    ]);
    
    console.log('All subgraphs started successfully!');
    
    // Start the federation gateway
    console.log('Starting Apollo Federation Gateway...');
    await startGateway();
    
    console.log('\n🚀 Federation setup complete!');
    console.log('Access the Gateway at: http://localhost:4000/graphql');
    console.log('Access the GraphQL Playground at: http://localhost:4000/graphql-playground');
    console.log('\nSubgraphs:');
    console.log('- Backend: http://localhost:4001/graphql');
    console.log('- GIS Hub: http://localhost:4002/graphql');
    console.log('- Levy Calculator: http://localhost:4003/graphql');
  } catch (error) {
    console.error('Error starting federation services:', error);
    process.exit(1);
  }
}

// Start the federation if this file is run directly
if (require.main === module) {
  startFederation();
}

export { startFederation };