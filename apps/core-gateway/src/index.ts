import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import fastifySession from '@fastify/session';
import { configureRoutes } from './routes';
import { configurePlugins } from './plugins';
import { setupDatabase } from './db';
import { logger } from './utils/logger';
import apolloGatewayPlugin from './graphql/gateway';

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
  
  // Register Apollo Federation Gateway
  await server.register(apolloGatewayPlugin);

  // Setup all routes
  await configureRoutes(server);

  // Health check route
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
  
  // GraphQL playground
  server.get('/graphql-playground', async (_, reply) => {
    reply.type('text/html').send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>GraphQL Playground</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, minimal-ui" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/css/index.css" />
        <link rel="shortcut icon" href="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/favicon.png" />
        <script src="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/js/middleware.js"></script>
      </head>
      <body>
        <div id="root">
          <style>
            body {
              background-color: rgb(23, 42, 58);
              font-family: Open Sans, sans-serif;
              height: 90vh;
            }
            #root {
              height: 100%;
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .loading {
              font-size: 32px;
              font-weight: 200;
              color: rgba(255, 255, 255, .6);
              margin-left: 20px;
            }
            img {
              width: 78px;
              height: 78px;
            }
            .title {
              font-weight: 400;
            }
          </style>
          <img src='https://cdn.jsdelivr.net/npm/graphql-playground-react/build/logo.png' alt=''>
          <div class="loading">Loading<span class="title">GraphQL Playground</span></div>
        </div>
        <script>
          window.addEventListener('load', function (event) {
            GraphQLPlayground.init(document.getElementById('root'), {
              endpoint: '/graphql'
            })
          })
        </script>
      </body>
      </html>
    `);
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