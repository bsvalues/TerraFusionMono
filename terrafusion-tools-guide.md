# TerraFusion Tools Guide

This document provides an overview of the tools available to help you work with the TerraFusion monorepo and its applications.

## Available Tools

### 1. Application Navigator

The **list-applications.sh** script helps you view all applications in the monorepo.

```bash
./list-applications.sh
```

This displays:
- All applications in the monorepo
- Packages and libraries
- Plugins
- How to work with applications using nx commands

### 2. Monorepo Navigator

The **mono-repo-navigator.html** provides a visual interface to explore the monorepo structure.

Start a simple web server:
```bash
python -m http.server 8080
```

Then open your browser to view the navigator.

### 3. Terra AI Helper

The **terra-ai-helper.js** script provides AI-assisted development using Anthropic's Claude model.

```bash
node terra-ai-helper.js
```

Features:
- Code generation
- Code explanation
- Debugging help
- API integration assistance

### 4. Terra Apps Guide

The **terra-apps-guide.js** script provides detailed information about specific applications in the monorepo.

```bash
node terra-apps-guide.js
```

Features:
- Application overview
- Code structure exploration
- Running instructions
- Integration guides
- API references

Currently detailed documentation is available for:
- TerraAgent - The AI assistant application

## Getting Started

1. **Explore the applications**:
   ```bash
   ./list-applications.sh
   ```

2. **Learn about a specific application**:
   ```bash
   node terra-apps-guide.js
   ```

3. **Get AI help for development**:
   ```bash
   node terra-ai-helper.js
   ```

## Working with Applications

### Starting an Application

```bash
npx nx serve app-name
```

Example:
```bash
npx nx serve terraagent
```

### Building an Application

```bash
npx nx build app-name
```

### Testing an Application

```bash
npx nx test app-name
```

### Checking Dependencies

```bash
npx nx dep-graph --focus=app-name
```

## TerraAgent AI Assistant

TerraAgent is a key application in the TerraFusion platform that provides AI-powered:
- SQL query generation
- Property tax levy calculations
- Neighborhood trend analysis
- PACS database integration

See the Terra Apps Guide for detailed documentation on TerraAgent.

## Using AI with TerraFusion

The monorepo includes several AI capabilities:

1. **TerraAgent**: A complete AI assistant application
2. **MCPS Agent Mesh**: A service for coordinating AI agents
3. **Terra AI Helper**: A tool for AI-assisted development
4. **MCP Package**: Model Content Protocol for AI interactions

To use AI capabilities, ensure you have the required API keys set as environment variables.

## Troubleshooting

If you encounter issues:

1. Check environment variables (API keys, database connections, etc.)
2. Use the Terra AI Helper's debug mode to get assistance
3. Check logs in the specific application directory
4. Use the dependency graph to check for dependency issues:
   ```bash
   npx nx dep-graph
   ```

## Further Documentation

For more information, see:
- `docs/` directory - Detailed documentation
- `README.md` files in each application directory