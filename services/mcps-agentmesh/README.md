# MCPS Agent Mesh

The MCPS Agent Mesh is a specialized service that provides AI-powered data transformations and processing for the TerraFusion platform.

## Features

- Distributed agent-based architecture for processing geospatial data
- AI-driven data transformation and enrichment
- Seamless integration with TerraFusion Core
- Real-time processing capabilities
- Scalable and fault-tolerant design

## Getting Started

To use the MCPS Agent Mesh in your TerraFusion installation:

```bash
# Install the MCPS Agent Mesh
terra install mcps-agentmesh

# Configure the agent mesh
terra config mcps-agentmesh --port 4000 --maxConnections 150 --logLevel info

# Start the service
terra service start mcps-agentmesh
```

## Configuration Options

The following configuration options are available:

| Option | Description | Default |
|--------|-------------|---------|
| `port` | The port on which the agent mesh service listens | 4000 |
| `maxConnections` | Maximum number of concurrent connections | 100 |
| `logLevel` | Logging level (debug, info, warn, error) | info |

## Development

For development and testing purposes, you can build and package the MCPS Agent Mesh using the NX build system:

```bash
# Build the agent mesh
nx build mcps-agentmesh

# Package the agent mesh for distribution
nx run mcps-agentmesh:pack
```

The packaged output will be available in the `dist/pack/mcps-agentmesh` directory.

## License

This package is licensed under the EULA-commercial license.