# TerraFusion Development Assistant Guide

This interactive tool helps you manage and work with applications in the TerraFusion monorepo and utilize AI agents for development tasks.

## Overview

The Development Assistant provides four main capabilities:

1. **Application Management** - List, serve, build, and test applications in the monorepo
2. **AI Development Assistant** - Generate code, get code reviews, debug help, and more using AI
3. **MCP Agent Services** - Manage and interact with AI agents in the Model Content Protocol system
4. **Monorepo Monitoring** - Check workspace health, dependencies, and application status

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Anthropic API key set as environment variable `ANTHROPIC_API_KEY`
- TerraFusion monorepo checked out

### Running the Assistant

```bash
# Make the script executable (if needed)
chmod +x terra-dev-assistant.js

# Run the assistant
./terra-dev-assistant.js
```

## Key Features

### Application Management

- **List Applications**: View all applications in the monorepo
- **Serve an Application**: Run a specific application for development
- **Build an Application**: Build a specific application for production
- **Test an Application**: Run tests for a specific application
- **View Dependencies**: Check dependencies for an application

### AI Development Assistant

- **Generate Code with AI**: Create new components, services, or utilities with AI
- **Code Review with AI**: Get AI-powered review of your code
- **Debug Assistance**: Get AI help for debugging issues
- **Generate Tests**: Create test cases automatically with AI
- **Generate Documentation**: Create documentation for your code

### MCP Agent Services

- **View Agent Status**: Check the status of all AI agents in the system
- **Start MCPS Agent Mesh**: Start the MCPS Agent Mesh service
- **Register New Agent**: Register a new AI agent with the system
- **View Active Tasks**: Check currently active agent tasks

### Monorepo Monitoring

- **Workspace Health Check**: Check the overall health of the monorepo
- **Check Dependencies**: Analyze dependencies across the monorepo
- **Check Vite Apps**: Validate Vite applications specifically

## Example Workflows

### Creating a New Component with AI

1. Select "AI Development Assistant" from the main menu
2. Choose "Generate Code with AI"
3. Select "Component" as the type of code to generate
4. Describe the component (e.g., "A dropdown menu with search functionality")
5. Specify the technology (e.g., "React with TypeScript")
6. Review the generated code and save it to a file

### Debugging an Issue

1. Select "AI Development Assistant" from the main menu
2. Choose "Debug Help"
3. Describe the issue you're facing
4. Provide any error messages or logs
5. Provide a relevant code snippet
6. Review the AI's debugging suggestions

### Starting an Application

1. Select "Application Management" from the main menu
2. Choose "Serve an Application"
3. Select the application you want to run
4. The application will start and you'll see the output

## Tips for Working with AI Agents

- **Be specific** in your requests to get better results
- **Provide context** when asking for code generation or debugging help
- **Review and refine** AI-generated code before using it in production
- **Start the MCPS Agent Mesh** to enable advanced AI capabilities

## Frequently Asked Questions

**Q: How do I add a new AI agent to the system?**
A: You can use the "Register New Agent" feature in the MCP Agent Services menu. You'll need to provide the agent implementation code and capabilities.

**Q: Can I use this tool outside of the TerraFusion monorepo?**
A: The tool is designed specifically for the TerraFusion monorepo structure and may not work correctly in other environments.

**Q: What AI models are being used?**
A: The tool primarily uses Anthropic's Claude model for code generation and assistance.

**Q: How can I customize the AI prompts?**
A: You can modify the code in `terra-dev-assistant.js` to customize the prompts sent to the AI models.