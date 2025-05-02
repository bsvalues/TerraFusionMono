# TerraFusion Platform

A comprehensive geospatial and agricultural management platform leveraging AI to revolutionize field data collection, crop health analysis, and collaborative insights for agricultural professionals.

## Features

- **Real-time Collaboration**: Synchronize field data across multiple devices
- **Crop Identification**: AI-powered identification of crops from images
- **Crop Health Analysis**: Detect diseases, pests, nutrient deficiencies
- **Yield Prediction**: Advanced algorithms to estimate crop yields
- **Geospatial Analytics**: Visualize field data with interactive maps
- **Plugin Marketplace**: Extend functionality with specialized plugins
- **Property Assessment System**: Complete property valuation and taxation management
- **Database Migration Framework**: Robust schema versioning and migration system

## Architecture

The platform follows a microservices architecture with Apollo Federation Gateway to connect specialized services:

- **Core Gateway**: Central API gateway that routes requests to appropriate services
- **Crop Identifier Service**: AI-powered crop identification
- **Crop Health Service**: Analysis of crop health and disease detection
- **Mobile Sync Service**: Real-time synchronization for field devices
- **Data Processing Service**: Background processing of uploaded data
- **Plugin Framework**: Extensible system for third-party integrations
- **Database Migration Service**: Automated schema versioning and deployment

## Technology Stack

- **Backend**: Node.js, Express, Apollo Server, GraphQL
- **Frontend**: React, TailwindCSS, shadcn/ui components
- **Mobile**: React Native
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Sync**: WebSockets, Y.js
- **AI Integration**: OpenAI with custom prompts for agricultural analysis
- **Build Tools**: Nx monorepo
- **Database Migrations**: Flyway with CI/CD integration
- **DevOps**: GitHub Actions, Docker, automated testing

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables (see `.env.example`)
4. Start the development server with `npm run dev`

## Documentation

- [Gateway Integration](./docs/GATEWAY_INTEGRATION.md)
- [Adding New Repositories](./docs/ADDING_NEW_REPOSITORIES.md)
- [WebSocket Fix](./docs/WEBSOCKET_FIX.md)
- [Database Schema](./docs/db-schema/README.md)
- [Migration Guidelines](./docs/db-schema/MIGRATION_GUIDELINES.md)
- [CI/CD Pipeline](./devops/ci/README.md)

## Database Migration System

TerraFusion includes a comprehensive database migration system based on Flyway:

- **Schema Versioning**: All database changes are versioned and tracked
- **Automated Testing**: Migrations are automatically tested in CI
- **Deployment Automation**: Seamless deployment to staging and production
- **Developer Tools**: Simplified workflows for creating and testing migrations
- **Documentation**: Detailed schema documentation and migration guidelines

To run migrations locally:

```bash
cd db-migrations
./run-local-migration.sh migrate
```

See the [Migration Guidelines](./docs/db-schema/MIGRATION_GUIDELINES.md) for best practices.

## Roadmap

- Enhanced mobile offline capabilities
- AR/VR visualization for field data
- Advanced predictive analytics for crop management
- More comprehensive ML models for crop analysis
- Integration with IoT sensors and drones
- Extended database schema for agricultural analysis