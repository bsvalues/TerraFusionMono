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

## Development Guidelines

- Follow the established coding conventions and structure
- Use the provided development tools for testing
- Ensure compatibility with mobile sync requirements
- Add comprehensive unit and integration tests

## License

This project is proprietary software - all rights reserved.