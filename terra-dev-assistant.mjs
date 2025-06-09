#!/usr/bin/env node

/**
 * TerraFusion Development Assistant
 * 
 * A command-line tool to help with managing applications in the TerraFusion monorepo
 * and utilizing AI agents to assist with development tasks.
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import readline from 'readline';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client - the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

/**
 * Main menu options
 */
const mainMenuOptions = [
  { id: 'apps', label: 'Application Management' },
  { id: 'ai-help', label: 'AI Development Assistant' },
  { id: 'mcp', label: 'MCP Agent Services' },
  { id: 'monitor', label: 'Monorepo Monitoring' },
  { id: 'exit', label: 'Exit' }
];

/**
 * Application management options
 */
const appManagementOptions = [
  { id: 'list', label: 'List All Applications' },
  { id: 'serve', label: 'Serve an Application' },
  { id: 'build', label: 'Build an Application' },
  { id: 'test', label: 'Test an Application' },
  { id: 'deps', label: 'View Application Dependencies' },
  { id: 'back', label: 'Back to Main Menu' }
];

/**
 * AI development assistant options
 */
const aiAssistantOptions = [
  { id: 'code-gen', label: 'Generate Code with AI' },
  { id: 'code-review', label: 'Code Review with AI' },
  { id: 'debug-help', label: 'Debug Assistance' },
  { id: 'test-gen', label: 'Generate Tests' },
  { id: 'doc-gen', label: 'Generate Documentation' },
  { id: 'back', label: 'Back to Main Menu' }
];

/**
 * MCP agent services options
 */
const mcpAgentOptions = [
  { id: 'status', label: 'View Agent Status' },
  { id: 'start-mcps', label: 'Start MCPS Agent Mesh' },
  { id: 'register', label: 'Register New Agent' },
  { id: 'tasks', label: 'View Active Agent Tasks' },
  { id: 'back', label: 'Back to Main Menu' }
];

/**
 * Monorepo monitoring options
 */
const monitoringOptions = [
  { id: 'workspace', label: 'Workspace Health Check' },
  { id: 'deps-check', label: 'Check Dependencies' },
  { id: 'vite-check', label: 'Check Vite Apps' },
  { id: 'back', label: 'Back to Main Menu' }
];

/**
 * Get applications from workspace.json
 */
function getApplications() {
  try {
    const workspaceContent = fs.readFileSync('workspace.json', 'utf8');
    const workspace = JSON.parse(workspaceContent);
    const apps = [];

    for (const [name, path] of Object.entries(workspace.projects)) {
      // Check if the path is a string or object with root property
      const appPath = typeof path === 'string' ? path : path.root;
      
      // Only include apps directory items
      if (appPath && appPath.startsWith('apps/')) {
        apps.push({
          name,
          path: appPath,
          // Extract the app name from the path (after the 'apps/' prefix)
          directory: appPath.replace('apps/', '')
        });
      }
    }

    return apps;
  } catch (error) {
    console.error(`${colors.fg.red}Error reading workspace.json: ${error.message}${colors.reset}`);
    return [];
  }
}

/**
 * Display a menu and get user selection
 */
async function displayMenu(title, options) {
  console.log(`\n${colors.fg.cyan}${colors.bright}${title}${colors.reset}\n`);
  
  options.forEach((option, index) => {
    console.log(`${colors.fg.yellow}${index + 1}. ${colors.reset}${option.label}`);
  });
  
  return new Promise((resolve) => {
    rl.question(`\n${colors.fg.green}Select an option (1-${options.length}): ${colors.reset}`, (answer) => {
      const index = parseInt(answer, 10) - 1;
      if (index >= 0 && index < options.length) {
        resolve(options[index].id);
      } else {
        console.log(`${colors.fg.red}Invalid selection. Please try again.${colors.reset}`);
        resolve(null);
      }
    });
  });
}

/**
 * List all applications in the monorepo
 */
function listApplications() {
  const apps = getApplications();
  
  console.log(`\n${colors.fg.cyan}${colors.bright}Applications in the Monorepo:${colors.reset}\n`);
  
  if (apps.length === 0) {
    console.log(`${colors.fg.yellow}No applications found.${colors.reset}`);
    return;
  }
  
  console.log(`${colors.fg.yellow}ID | Name | Path${colors.reset}`);
  console.log(`${colors.fg.yellow}---------------------------${colors.reset}`);
  
  apps.forEach((app, index) => {
    console.log(`${colors.fg.green}${index + 1}${colors.reset} | ${colors.fg.cyan}${app.name}${colors.reset} | ${app.path}`);
  });
}

/**
 * Serve an application using nx
 */
async function serveApplication() {
  const apps = getApplications();
  
  console.log(`\n${colors.fg.cyan}${colors.bright}Serve an Application:${colors.reset}\n`);
  
  if (apps.length === 0) {
    console.log(`${colors.fg.yellow}No applications found.${colors.reset}`);
    return;
  }
  
  apps.forEach((app, index) => {
    console.log(`${colors.fg.green}${index + 1}${colors.reset} | ${colors.fg.cyan}${app.name}${colors.reset} | ${app.path}`);
  });
  
  const appIndex = await new Promise((resolve) => {
    rl.question(`\n${colors.fg.green}Select an application to serve (1-${apps.length}): ${colors.reset}`, (answer) => {
      const index = parseInt(answer, 10) - 1;
      if (index >= 0 && index < apps.length) {
        resolve(index);
      } else {
        console.log(`${colors.fg.red}Invalid selection.${colors.reset}`);
        resolve(-1);
      }
    });
  });
  
  if (appIndex === -1) return;
  
  const selectedApp = apps[appIndex];
  console.log(`\n${colors.fg.cyan}Starting ${selectedApp.name}...${colors.reset}`);
  
  try {
    // Run the nx serve command in a child process
    const child = spawn('npx', ['nx', 'serve', selectedApp.name], {
      stdio: 'inherit',
      shell: true
    });
    
    console.log(`\n${colors.fg.green}Application ${selectedApp.name} is running.${colors.reset}`);
    console.log(`${colors.fg.yellow}Press Ctrl+C to stop the application.${colors.reset}`);
    
    // Wait for the process to finish
    await new Promise((resolve) => {
      child.on('close', (code) => {
        console.log(`\n${colors.fg.yellow}Application ${selectedApp.name} stopped with code ${code}.${colors.reset}`);
        resolve();
      });
    });
  } catch (error) {
    console.error(`${colors.fg.red}Error serving application: ${error.message}${colors.reset}`);
  }
}

/**
 * Generate code with AI
 */
async function generateCodeWithAI() {
  console.log(`\n${colors.fg.cyan}${colors.bright}Generate Code with AI:${colors.reset}\n`);
  
  // Ask for the type of code to generate
  const codeTypes = [
    'Component', 'API Endpoint', 'Utility Function', 
    'Data Model', 'Test', 'Custom'
  ];
  
  codeTypes.forEach((type, index) => {
    console.log(`${colors.fg.green}${index + 1}${colors.reset} | ${type}`);
  });
  
  const typeIndex = await new Promise((resolve) => {
    rl.question(`\n${colors.fg.green}Select the type of code to generate (1-${codeTypes.length}): ${colors.reset}`, (answer) => {
      const index = parseInt(answer, 10) - 1;
      if (index >= 0 && index < codeTypes.length) {
        resolve(index);
      } else {
        console.log(`${colors.fg.red}Invalid selection.${colors.reset}`);
        resolve(-1);
      }
    });
  });
  
  if (typeIndex === -1) return;
  
  const selectedType = codeTypes[typeIndex];
  
  // Ask for a description of what to generate
  const description = await new Promise((resolve) => {
    rl.question(`\n${colors.fg.green}Describe the ${selectedType.toLowerCase()} you want to generate: ${colors.reset}`, (answer) => {
      resolve(answer);
    });
  });
  
  // Ask for the technology/framework
  const technology = await new Promise((resolve) => {
    rl.question(`\n${colors.fg.green}What technology/framework should this use? (e.g., React, Express, TypeScript): ${colors.reset}`, (answer) => {
      resolve(answer);
    });
  });
  
  console.log(`\n${colors.fg.yellow}Generating ${selectedType.toLowerCase()} with AI...${colors.reset}`);
  
  try {
    // Create the prompt for code generation
    let prompt = `Generate a ${selectedType.toLowerCase()} for: ${description}\n\n`;
    prompt += `Technology/framework: ${technology}\n\n`;
    prompt += "Please provide well-structured, production-ready code with comments. Follow best practices for the specified technology.";
    
    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4000,
      messages: [
        { role: "user", content: prompt }
      ]
    });
    
    const generatedContent = response.content[0].text;
    
    // Extract code blocks from the response
    const codeBlocks = extractCodeBlocks(generatedContent);
    
    if (codeBlocks.length === 0) {
      console.log(`\n${colors.fg.yellow}No code blocks found in the AI response. Full response:${colors.reset}\n`);
      console.log(generatedContent);
      return;
    }
    
    // Display the first code block
    console.log(`\n${colors.fg.cyan}${colors.bright}Generated Code:${colors.reset}\n`);
    console.log(codeBlocks[0].code);
    
    // Ask if the user wants to save the code
    const shouldSave = await new Promise((resolve) => {
      rl.question(`\n${colors.fg.green}Do you want to save this code to a file? (y/n): ${colors.reset}`, (answer) => {
        resolve(answer.toLowerCase() === 'y');
      });
    });
    
    if (shouldSave) {
      // Ask for the file path
      const filePath = await new Promise((resolve) => {
        rl.question(`\n${colors.fg.green}Enter the file path to save to: ${colors.reset}`, (answer) => {
          resolve(answer);
        });
      });
      
      // Create directory if it doesn't exist
      const directory = path.dirname(filePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      // Save the code to the file
      fs.writeFileSync(filePath, codeBlocks[0].code);
      console.log(`\n${colors.fg.green}Code saved to ${filePath}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.fg.red}Error generating code: ${error.message}${colors.reset}`);
  }
}

/**
 * Extract code blocks from a markdown string
 */
function extractCodeBlocks(markdown) {
  const codeBlockRegex = /```(?:(\w+)\n)?([\s\S]*?)```/g;
  const codeBlocks = [];
  
  let match;
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    codeBlocks.push({
      language: match[1] || 'text',
      code: match[2]
    });
  }
  
  return codeBlocks;
}

/**
 * Check dependencies in the monorepo
 */
function checkDependencies() {
  console.log(`\n${colors.fg.cyan}${colors.bright}Checking Dependencies...${colors.reset}\n`);
  
  try {
    // Execute the check-dependencies.sh script if it exists
    if (fs.existsSync('./check-dependencies.sh')) {
      console.log(execSync('./check-dependencies.sh', { encoding: 'utf8' }));
    } else {
      console.log(`${colors.fg.yellow}check-dependencies.sh script not found. Using alternative method.${colors.reset}\n`);
      
      // Use nx dep-graph command to check dependencies
      console.log(execSync('npx nx dep-graph --file=dep-graph.json', { encoding: 'utf8' }));
      console.log(`\n${colors.fg.green}Dependency graph generated to dep-graph.json${colors.reset}`);
      
      // Parse the dependency graph
      if (fs.existsSync('dep-graph.json')) {
        const depGraph = JSON.parse(fs.readFileSync('dep-graph.json', 'utf8'));
        
        console.log(`\n${colors.fg.yellow}Dependencies Summary:${colors.reset}`);
        console.log(`${colors.fg.green}Total projects: ${Object.keys(depGraph.graph.nodes).length}${colors.reset}`);
        console.log(`${colors.fg.green}Total dependencies: ${Object.keys(depGraph.graph.dependencies).length}${colors.reset}`);
        
        // Show projects with most dependencies
        const projectDeps = {};
        for (const [from, deps] of Object.entries(depGraph.graph.dependencies)) {
          projectDeps[from] = deps.length;
        }
        
        console.log(`\n${colors.fg.yellow}Projects with Most Dependencies:${colors.reset}`);
        Object.entries(projectDeps)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .forEach(([project, count]) => {
            console.log(`${colors.fg.cyan}${project}${colors.reset}: ${count} dependencies`);
          });
      }
    }
  } catch (error) {
    console.error(`${colors.fg.red}Error checking dependencies: ${error.message}${colors.reset}`);
  }
}

/**
 * View MCPS Agent Mesh status
 */
function viewAgentStatus() {
  console.log(`\n${colors.fg.cyan}${colors.bright}Agent Status:${colors.reset}\n`);
  
  try {
    // Check if MCPS Agent Mesh is installed
    if (fs.existsSync('services/mcps-agentmesh')) {
      console.log(`${colors.fg.green}MCPS Agent Mesh is installed.${colors.reset}`);
      
      // Check if the service is running (this is a simple check, might need adjustment)
      try {
        // This assumes the service exposes a health endpoint
        const healthCheckUrl = 'http://localhost:8080/health';
        execSync(`curl -s ${healthCheckUrl}`);
        console.log(`${colors.fg.green}MCPS Agent Mesh is running.${colors.reset}`);
      } catch (error) {
        console.log(`${colors.fg.yellow}MCPS Agent Mesh is not running or not responding.${colors.reset}`);
      }
    } else {
      console.log(`${colors.fg.yellow}MCPS Agent Mesh is not installed.${colors.reset}`);
    }
    
    // Show information about available agents
    console.log(`\n${colors.fg.yellow}AI Agents in the Monorepo:${colors.reset}\n`);
    
    // Define a list of directories to search for agent implementations
    const agentSearchPaths = [
      'apps/*/ai_agents',
      'apps/*/agents',
      'apps/*/mcp/agents',
      'services/mcps-agentmesh/src/agents'
    ];
    
    // Search for agent files
    let foundAgents = 0;
    for (const searchPath of agentSearchPaths) {
      try {
        // Use find command to locate agent files
        const agentFiles = execSync(`find ${searchPath} -name "*agent*.py" -o -name "*agent*.js" -o -name "*agent*.ts" 2>/dev/null`, { encoding: 'utf8' })
          .trim()
          .split('\n')
          .filter(Boolean);
        
        for (const agentFile of agentFiles) {
          foundAgents++;
          
          // Extract agent info from file (basic implementation)
          const agentContent = fs.readFileSync(agentFile, 'utf8');
          let agentName = path.basename(agentFile);
          
          // Try to extract the class name or a better name from the file
          const classMatch = agentContent.match(/class\s+(\w+Agent)/);
          if (classMatch) {
            agentName = classMatch[1];
          }
          
          console.log(`${colors.fg.green}${foundAgents}. ${colors.fg.cyan}${agentName}${colors.reset} - ${agentFile}`);
          
          // Try to extract capabilities
          const capabilitiesMatch = agentContent.match(/capabilities\s*=\s*\[(.*?)\]/s);
          if (capabilitiesMatch) {
            const capabilities = capabilitiesMatch[1]
              .split(',')
              .map(cap => cap.trim().replace(/['"]/g, ''))
              .filter(Boolean);
            
            if (capabilities.length > 0) {
              console.log(`   ${colors.fg.yellow}Capabilities:${colors.reset} ${capabilities.join(', ')}`);
            }
          }
        }
      } catch (error) {
        // Ignore errors from the find command
      }
    }
    
    if (foundAgents === 0) {
      console.log(`${colors.fg.yellow}No AI agents found in the monorepo.${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.fg.red}Error checking agent status: ${error.message}${colors.reset}`);
  }
}

/**
 * Start the MCPS Agent Mesh service
 */
async function startMcpsAgentMesh() {
  console.log(`\n${colors.fg.cyan}${colors.bright}Starting MCPS Agent Mesh...${colors.reset}\n`);
  
  try {
    // Check if MCPS Agent Mesh is installed
    if (!fs.existsSync('services/mcps-agentmesh')) {
      console.log(`${colors.fg.yellow}MCPS Agent Mesh is not installed.${colors.reset}`);
      return;
    }
    
    // Use nx to serve the mcps-agentmesh service
    console.log(`${colors.fg.yellow}Starting MCPS Agent Mesh service...${colors.reset}`);
    
    // Run the nx serve command in a child process
    const child = spawn('npx', ['nx', 'serve', 'mcps-agentmesh'], {
      stdio: 'inherit',
      shell: true
    });
    
    console.log(`\n${colors.fg.green}MCPS Agent Mesh service is running.${colors.reset}`);
    console.log(`${colors.fg.yellow}Press Ctrl+C to stop the service.${colors.reset}`);
    
    // Wait for the process to finish
    await new Promise((resolve) => {
      child.on('close', (code) => {
        console.log(`\n${colors.fg.yellow}MCPS Agent Mesh service stopped with code ${code}.${colors.reset}`);
        resolve();
      });
    });
  } catch (error) {
    console.error(`${colors.fg.red}Error starting MCPS Agent Mesh: ${error.message}${colors.reset}`);
  }
}

/**
 * Get help from AI for debugging
 */
async function getDebugHelp() {
  console.log(`\n${colors.fg.cyan}${colors.bright}AI Debug Assistant:${colors.reset}\n`);
  
  // Ask for the description of the issue
  const issueDescription = await new Promise((resolve) => {
    rl.question(`${colors.fg.green}Describe the issue you're facing: ${colors.reset}`, (answer) => {
      resolve(answer);
    });
  });
  
  // Ask for error messages or logs
  const errorMessages = await new Promise((resolve) => {
    rl.question(`\n${colors.fg.green}Provide any error messages or logs (press Enter if none): ${colors.reset}`, (answer) => {
      resolve(answer);
    });
  });
  
  // Ask for code snippet
  const codeSnippet = await new Promise((resolve) => {
    rl.question(`\n${colors.fg.green}Provide a relevant code snippet (press Enter if none): ${colors.reset}`, (answer) => {
      resolve(answer);
    });
  });
  
  console.log(`\n${colors.fg.yellow}Getting debug help from AI...${colors.reset}`);
  
  try {
    // Create the prompt for debug help
    let prompt = `I need help debugging an issue in my TerraFusion monorepo application.\n\n`;
    prompt += `Issue description: ${issueDescription}\n\n`;
    
    if (errorMessages) {
      prompt += `Error messages or logs:\n\`\`\`\n${errorMessages}\n\`\`\`\n\n`;
    }
    
    if (codeSnippet) {
      prompt += `Code snippet:\n\`\`\`\n${codeSnippet}\n\`\`\`\n\n`;
    }
    
    prompt += "Please provide:\n";
    prompt += "1. What might be causing this issue\n";
    prompt += "2. Steps to diagnose it further\n";
    prompt += "3. Potential solutions\n";
    prompt += "4. Any code examples that could help fix the problem";
    
    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4000,
      messages: [
        { role: "user", content: prompt }
      ]
    });
    
    const debugHelp = response.content[0].text;
    
    // Display the AI's response
    console.log(`\n${colors.fg.cyan}${colors.bright}AI Debug Help:${colors.reset}\n`);
    console.log(debugHelp);
    
    // Ask if the user wants to save the response
    const shouldSave = await new Promise((resolve) => {
      rl.question(`\n${colors.fg.green}Do you want to save this debug help to a file? (y/n): ${colors.reset}`, (answer) => {
        resolve(answer.toLowerCase() === 'y');
      });
    });
    
    if (shouldSave) {
      // Ask for the file path
      const filePath = await new Promise((resolve) => {
        rl.question(`\n${colors.fg.green}Enter the file path to save to: ${colors.reset}`, (answer) => {
          resolve(answer);
        });
      });
      
      // Create directory if it doesn't exist
      const directory = path.dirname(filePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      // Save the debug help to the file
      fs.writeFileSync(filePath, debugHelp);
      console.log(`\n${colors.fg.green}Debug help saved to ${filePath}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.fg.red}Error getting debug help: ${error.message}${colors.reset}`);
  }
}

/**
 * Main function to run the assistant
 */
async function main() {
  console.log(`\n${colors.fg.cyan}${colors.bright}================================${colors.reset}`);
  console.log(`${colors.fg.cyan}${colors.bright} TerraFusion Development Assistant ${colors.reset}`);
  console.log(`${colors.fg.cyan}${colors.bright}================================${colors.reset}`);
  
  let running = true;
  
  while (running) {
    const mainChoice = await displayMenu('Main Menu', mainMenuOptions);
    
    switch (mainChoice) {
      case 'apps':
        let appsMenuRunning = true;
        while (appsMenuRunning) {
          const appsChoice = await displayMenu('Application Management', appManagementOptions);
          
          switch (appsChoice) {
            case 'list':
              listApplications();
              break;
            case 'serve':
              await serveApplication();
              appsMenuRunning = false; // Exit after serving an app
              break;
            case 'build':
              console.log('Building an application... (not implemented yet)');
              break;
            case 'test':
              console.log('Testing an application... (not implemented yet)');
              break;
            case 'deps':
              console.log('Viewing application dependencies... (not implemented yet)');
              break;
            case 'back':
              appsMenuRunning = false;
              break;
            default:
              break;
          }
        }
        break;
        
      case 'ai-help':
        let aiMenuRunning = true;
        while (aiMenuRunning) {
          const aiChoice = await displayMenu('AI Development Assistant', aiAssistantOptions);
          
          switch (aiChoice) {
            case 'code-gen':
              await generateCodeWithAI();
              break;
            case 'code-review':
              console.log('Code review with AI... (not implemented yet)');
              break;
            case 'debug-help':
              await getDebugHelp();
              break;
            case 'test-gen':
              console.log('Generating tests... (not implemented yet)');
              break;
            case 'doc-gen':
              console.log('Generating documentation... (not implemented yet)');
              break;
            case 'back':
              aiMenuRunning = false;
              break;
            default:
              break;
          }
        }
        break;
        
      case 'mcp':
        let mcpMenuRunning = true;
        while (mcpMenuRunning) {
          const mcpChoice = await displayMenu('MCP Agent Services', mcpAgentOptions);
          
          switch (mcpChoice) {
            case 'status':
              viewAgentStatus();
              break;
            case 'start-mcps':
              await startMcpsAgentMesh();
              mcpMenuRunning = false; // Exit after starting the service
              break;
            case 'register':
              console.log('Registering a new agent... (not implemented yet)');
              break;
            case 'tasks':
              console.log('Viewing active agent tasks... (not implemented yet)');
              break;
            case 'back':
              mcpMenuRunning = false;
              break;
            default:
              break;
          }
        }
        break;
        
      case 'monitor':
        let monitorMenuRunning = true;
        while (monitorMenuRunning) {
          const monitorChoice = await displayMenu('Monorepo Monitoring', monitoringOptions);
          
          switch (monitorChoice) {
            case 'workspace':
              console.log('Checking workspace health... (not implemented yet)');
              break;
            case 'deps-check':
              checkDependencies();
              break;
            case 'vite-check':
              console.log('Checking Vite apps... (not implemented yet)');
              break;
            case 'back':
              monitorMenuRunning = false;
              break;
            default:
              break;
          }
        }
        break;
        
      case 'exit':
        console.log(`\n${colors.fg.green}Thank you for using the TerraFusion Development Assistant!${colors.reset}`);
        running = false;
        rl.close();
        break;
        
      default:
        break;
    }
  }
}

// Run the assistant
main().catch(error => {
  console.error(`${colors.fg.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});