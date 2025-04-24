import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import fastifySession from '@fastify/session';
import { configureRoutes } from './routes';
import { configurePlugins } from './plugins';
import { setupDatabase } from './db';
import { logger } from './utils/logger';

async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: true,
    trustProxy: true,
  });

  // Register plugins
  await server.register(cors, {
    origin: true,
    credentials: true,
  });

  await server.register(swagger, {
    routePrefix: '/documentation',
    swagger: {
      info: {
        title: 'TerraFusion API',
        description: 'TerraFusion Core API Gateway',
        version: '1.0.0',
      },
      host: process.env.API_HOST || 'localhost:5000',
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
    exposeRoute: true,
  });

  // Setup database
  await setupDatabase(server);

  // Configure application plugins
  await configurePlugins(server);

  // Setup all routes
  await configureRoutes(server);

  // Health check route
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return server;
}

async function startServer() {
  try {
    const server = await buildServer();
    
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    
    logger.info(`Server started on ${host}:${port}`);
  } catch (err) {
    logger.error('Error starting server:', err);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { buildServer };