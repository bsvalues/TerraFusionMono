import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { schema } from './schema';
import { testPostGIS } from './db';
import { Logger } from './utils/logger';

const logger = new Logger('GisService');

async function startServer() {
  // Test PostGIS connection
  const postgisVersion = await testPostGIS();
  logger.info(`Connected to PostGIS version: ${postgisVersion}`);

  // Create Apollo server with the schema
  const server = new ApolloServer({
    schema: buildSubgraphSchema(schema),
  });

  // Start the server
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4003 }
  });

  logger.info(`🚀 GIS subgraph ready at ${url}`);
  logger.info('This service provides geospatial functionality for TerraFusion');
}

// Start the GIS service
startServer().catch(err => {
  logger.error(`Failed to start GIS service: ${err}`);
  process.exit(1);
});