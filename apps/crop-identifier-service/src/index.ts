import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { schema } from './schema';
import dotenv from 'dotenv';
import { Logger } from './utils/logger';

// Load environment variables
dotenv.config();

const logger = new Logger('CropIdentifierService');

// Create the Apollo Server with the schema
const server = new ApolloServer({
  schema,
  plugins: [
    // Plugin for logging requests
    {
      async requestDidStart(requestContext) {
        logger.info(`🔍 GraphQL request: ${requestContext.request.operationName || 'anonymous operation'}`);
        return {
          async didEncounterErrors(requestContext) {
            if (requestContext.errors) {
              requestContext.errors.forEach((error) => {
                logger.error(`❌ GraphQL error: ${error.message}`);
              });
            }
          },
          async willSendResponse(requestContext) {
            logger.info(`📤 GraphQL response: ${requestContext.request.operationName || 'anonymous operation'}`);
          },
        };
      },
    },
  ],
});

// Start the server
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4009;

async function startServer() {
  try {
    const { url } = await startStandaloneServer(server, {
      listen: { port: PORT, host: '0.0.0.0' },
      context: async ({ req }) => {
        // Add auth context if needed
        return {
          auth: req.headers.authorization,
        };
      },
    });

    logger.info(`🚀 Crop Identifier subgraph server running at ${url}`);
    logger.info(`🔗 Federation endpoint available at ${url}graphql`);
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
}

startServer();