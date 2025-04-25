# TerraFusion Platform

A comprehensive geospatial and agricultural management platform leveraging AI to revolutionize field data collection, crop health analysis, and agricultural insights for professionals.

## Overview

TerraFusion integrates advanced technologies to provide farmers and agricultural experts with powerful tools for data-driven decision-making, featuring robust microservices architecture and real-time collaborative capabilities with enhanced sync and connectivity features.

## Key Features

- **Microservices Architecture**: Modular, scalable design using NestJS core framework
- **Mobile Integration**: React Native mobile frontend with offline-first capabilities
- **Real-time Collaboration**: WebSocket communication and Y.js collaborative editing
- **AI-Powered Analysis**: OpenAI integration for crop health insights and recommendations
- **Geospatial Analysis**: Advanced mapping and GIS features for field management
- **Performance Monitoring**: Prometheus metrics collection and Grafana dashboards

## Technology Stack

- **Backend**: NestJS, Express, GraphQL Federation (Apollo)
- **Frontend**: React with Vite, shadcn/ui, and TailwindCSS
- **Mobile**: React Native with Realm local database
- **Databases**: PostgreSQL, Drizzle ORM
- **Real-time**: WebSocket, Y.js collaborative editing
- **AI**: OpenAI for image analysis and recommendations
- **DevOps**: CI/CD, Docker, Prometheus, Grafana
- **Monorepo**: Nx for repository management

## Core Components

- **Federation Gateway**: Consolidates multiple GraphQL services 
- **SyncStatusPanel**: Monitors and controls mobile app synchronization
- **Crop Analysis**: AI-powered crop health assessment using OpenAI Vision

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key for crop analysis features

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-org/terrafusion.git
   cd terrafusion
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   ```
   - Update database connection parameters
   - Add your OpenAI API key

4. Run database setup:
   ```
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

## Monorepo Structure & Federation

This repository is organized as a monorepo using Nx, integrating multiple applications with Apollo Federation for GraphQL services.

### Imported Repositories

The following repositories have been imported and integrated:

#### Terra Repositories:
- `terraagent`: Agent-based data collection and analysis
- `terraf`: Field mapping and analysis tools
- `terraflow`: Workflow engine for agricultural processes
- `terrafusionpro`: Professional analytics suite
- `terrafusionsync`: Mobile data synchronization service
- `terralegislativepulsepub`: Legislative tracking and reporting
- `terraminer`: Data mining and pattern analysis

#### BCBS Repositories:
- `bcbscostapp`: Cost assessment application
- `bcbsgispro`: GIS professional tools
- `bcbslevy`: Levy calculation service
- `bcbswebhub`: Web portal and hub
- `bsbcmaster`: Master data management
- `bsincomevaluation`: Income and asset valuation tools

### Import Scripts

The repository includes scripts to manage the import process:
- `import-repos.sh`: Main import script for all repositories
- `import-bcbs-repos.sh`: Import BCBS-specific repositories
- `import-remaining-repos.sh`: Import any remaining repositories
- `import-single-repo.sh`: Import a single repository with:
  ```
  ./import-single-repo.sh RepositoryName
  ```

### Working with the Federation Gateway

The Apollo Federation Gateway consolidates all GraphQL services:

1. Start the gateway:
   ```
   ./start-gateway.sh
   ```

2. Access the GraphQL endpoint at `http://localhost:4000/graphql`

3. Check gateway health at:
   - `http://localhost:4000/health/live` - Service liveness
   - `http://localhost:4000/health/ready` - Service readiness with subgraph status

4. Start individual services with:
   ```
   nx serve <service-name>
   ```

## Testing the OpenAI Integration

We provide tools to test the crop analysis capabilities:

1. Add crop images to the `tools/test-images` directory
2. Run the test script:
   ```
   node tools/test-openai.js ./tools/test-images/your-image.jpg
   ```
3. To test the API endpoint directly:
   ```
   node tools/test-openai.js ./tools/test-images/your-image.jpg --api
   ```

## Project Structure

- `apps/`: Individual applications including backend services and frontend
- `client/`: Web client application
- `server/`: Main server implementation
- `shared/`: Shared code, types, and utilities
- `plugins/`: Plugin implementations for extensibility
- `tools/`: Development and utility scripts
- `grafana/`: Monitoring dashboards
- `prometheus/`: Metrics collection
- `docs/`: Documentation for development and integration

## Documentation

For detailed information about specific aspects of the platform, refer to these guides:

- [Repository Import Process](docs/REPOSITORY_IMPORT.md) - How repositories are imported into the monorepo
- [Apollo Gateway Integration](docs/GATEWAY_INTEGRATION.md) - How to integrate services with the Federation Gateway
- [WebSocket Fix for Replit](docs/WEBSOCKET_FIX.md) - How to fix WebSocket connections in Replit environment
- [WebSocket Testing Guide](docs/WEBSOCKET_TESTING.md) - How to test and debug WebSocket connections

## Development Guidelines

- Follow the established coding conventions and structure
- Use the provided development tools for testing
- Ensure compatibility with mobile sync requirements
- Add comprehensive unit and integration tests
- Add WebSocket fixes for Replit when creating Vite-based applications
- Register new GraphQL services with the Federation Gateway

## License

This project is proprietary software - all rights reserved.