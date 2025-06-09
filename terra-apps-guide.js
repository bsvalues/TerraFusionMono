#!/usr/bin/env node

/**
 * TerraFusion Applications Guide
 * 
 * A tool to help understand and integrate with applications in the TerraFusion monorepo
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

// Create readline interface
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
  
  fg: {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
  }
};

/**
 * Main menu options
 */
const mainMenuOptions = [
  { id: 'terraagent', label: 'TerraAgent - AI Assistant' },
  { id: 'terraflow', label: 'TerraFlow - Workflow Engine' },
  { id: 'terrafusionpro', label: 'TerraFusion Pro - Main Platform' },
  { id: 'bcbslevy', label: 'BCBS Levy Calculator' },
  { id: 'exit', label: 'Exit' }
];

/**
 * TerraAgent submenu options
 */
const terraAgentOptions = [
  { id: 'overview', label: 'Application Overview' },
  { id: 'structure', label: 'Code Structure' },
  { id: 'run', label: 'How to Run' },
  { id: 'integrate', label: 'Integration Guide' },
  { id: 'api', label: 'API Reference' },
  { id: 'back', label: 'Back to Main Menu' }
];

/**
 * Ask a question and get user input
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
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
        console.log(`Invalid selection. Please try again.`);
        resolve(null);
      }
    });
  });
}

/**
 * Show TerraAgent overview
 */
function showTerraAgentOverview() {
  console.log(`\n${colors.fg.cyan}${colors.bright}TerraAgent Overview${colors.reset}\n`);
  console.log(`${colors.fg.white}TerraAgent is an AI-powered assistant for the TerraFusion platform.${colors.reset}`);
  console.log(`${colors.fg.white}It provides capabilities for:${colors.reset}`);
  console.log(`  - ${colors.fg.green}SQL query generation and transformation${colors.reset}`);
  console.log(`  - ${colors.fg.green}Property tax levy calculations${colors.reset}`);
  console.log(`  - ${colors.fg.green}Neighborhood trend analysis${colors.reset}`);
  console.log(`  - ${colors.fg.green}Integration with PACS database systems${colors.reset}`);
  console.log(`  - ${colors.fg.green}Both web UI and chat interfaces${colors.reset}`);
  
  console.log(`\n${colors.fg.cyan}Key Technologies:${colors.reset}`);
  console.log(`  - ${colors.fg.yellow}Backend:${colors.reset} Flask, LangChain, SQLAlchemy`);
  console.log(`  - ${colors.fg.yellow}AI Integration:${colors.reset} OpenAI, Claude`);
  console.log(`  - ${colors.fg.yellow}Database:${colors.reset} SQL Server with PACS schema`);
  console.log(`  - ${colors.fg.yellow}Monitoring:${colors.reset} Prometheus metrics`);
  
  console.log(`\n${colors.fg.cyan}Main Features:${colors.reset}`);
  console.log(`  1. ${colors.fg.green}Natural language to SQL conversion${colors.reset}`);
  console.log(`  2. ${colors.fg.green}Property tax calculation pipeline${colors.reset}`);
  console.log(`  3. ${colors.fg.green}Neighborhood trend analysis${colors.reset}`);
  console.log(`  4. ${colors.fg.green}Integration with SQL database${colors.reset}`);
  console.log(`  5. ${colors.fg.green}Specialized chains for domain-specific tasks${colors.reset}`);
}

/**
 * Show TerraAgent code structure
 */
function showTerraAgentStructure() {
  console.log(`\n${colors.fg.cyan}${colors.bright}TerraAgent Code Structure${colors.reset}\n`);
  
  console.log(`${colors.fg.white}TerraAgent follows a modular structure:${colors.reset}`);
  console.log(`
${colors.fg.yellow}apps/terraagent/${colors.reset}
├── ${colors.fg.cyan}main.py${colors.reset} - Entry point for gunicorn
├── ${colors.fg.cyan}app.py${colors.reset} - Flask application & routes
├── ${colors.fg.cyan}chainlit_app.py${colors.reset} - Chainlit chat interface
├── ${colors.fg.cyan}pacs_agent.py${colors.reset} - LangChain SQL agent
├── ${colors.fg.cyan}chains/${colors.reset}
│   ├── ${colors.fg.green}levy_calculator.py${colors.reset} - Property tax calculation chain
│   └── ${colors.fg.green}neighborhood_trends.py${colors.reset} - Neighborhood analysis chain
└── ${colors.fg.cyan}utils/${colors.reset}
    ├── ${colors.fg.green}auth.py${colors.reset} - Authentication utilities
    ├── ${colors.fg.green}dbatools.py${colors.reset} - Database tools & helpers
    └── ${colors.fg.green}monitoring.py${colors.reset} - Prometheus metrics & logging
  `);
  
  console.log(`\n${colors.fg.cyan}Key Files:${colors.reset}`);
  console.log(`  - ${colors.fg.yellow}app.py:${colors.reset} Main Flask application with API routes`);
  console.log(`  - ${colors.fg.yellow}pacs_agent.py:${colors.reset} LangChain agent for SQL queries`);
  console.log(`  - ${colors.fg.yellow}chains/levy_calculator.py:${colors.reset} Property tax chain`);
  
  console.log(`\n${colors.fg.cyan}Execution Flow:${colors.reset}`);
  console.log(`  1. HTTP request comes to a Flask route in ${colors.fg.yellow}app.py${colors.reset}`);
  console.log(`  2. Route handler calls appropriate chain/agent based on query type`);
  console.log(`  3. Chain executes using LangChain components & LLM`);
  console.log(`  4. Results returned as JSON response`);
}

/**
 * Show how to run TerraAgent
 */
function showTerraAgentRunGuide() {
  console.log(`\n${colors.fg.cyan}${colors.bright}How to Run TerraAgent${colors.reset}\n`);
  
  console.log(`${colors.fg.white}There are several ways to run TerraAgent:${colors.reset}`);
  
  console.log(`\n${colors.fg.cyan}1. Using NX:${colors.reset}`);
  console.log(`   ${colors.fg.yellow}npx nx serve terraagent${colors.reset}`);
  
  console.log(`\n${colors.fg.cyan}2. Directly with Python:${colors.reset}`);
  console.log(`   ${colors.fg.yellow}cd apps/terraagent${colors.reset}`);
  console.log(`   ${colors.fg.yellow}python app.py${colors.reset}`);
  
  console.log(`\n${colors.fg.cyan}3. Using Chainlit for the chat interface:${colors.reset}`);
  console.log(`   ${colors.fg.yellow}cd apps/terraagent${colors.reset}`);
  console.log(`   ${colors.fg.yellow}chainlit run chainlit_app.py${colors.reset}`);
  
  console.log(`\n${colors.fg.cyan}Required Environment Variables:${colors.reset}`);
  console.log(`  - ${colors.fg.yellow}OPENAI_API_KEY${colors.reset} - API key for OpenAI`);
  console.log(`  - ${colors.fg.yellow}PACS_DB_HOST${colors.reset} - PACS database host (if not using Windows Auth)`);
  console.log(`  - ${colors.fg.yellow}PACS_DB_NAME${colors.reset} - PACS database name (if not using Windows Auth)`);
  console.log(`  - ${colors.fg.yellow}PACS_DB_USER${colors.reset} - PACS database username (if not using Windows Auth)`);
  console.log(`  - ${colors.fg.yellow}PACS_DB_PASS${colors.reset} - PACS database password (if not using Windows Auth)`);
  
  console.log(`\n${colors.fg.cyan}Accessing the Application:${colors.reset}`);
  console.log(`  - Web UI: ${colors.fg.green}http://localhost:5000${colors.reset}`);
  console.log(`  - Chainlit Chat: ${colors.fg.green}http://localhost:8000${colors.reset}`);
  console.log(`  - API Endpoint: ${colors.fg.green}http://localhost:5000/api/query${colors.reset}`);
}

/**
 * Show TerraAgent integration guide
 */
function showTerraAgentIntegrationGuide() {
  console.log(`\n${colors.fg.cyan}${colors.bright}TerraAgent Integration Guide${colors.reset}\n`);
  
  console.log(`${colors.fg.white}TerraAgent can be integrated with other applications in the monorepo in several ways:${colors.reset}`);
  
  console.log(`\n${colors.fg.cyan}1. Via Apollo Gateway:${colors.reset}`);
  console.log(`   The TerraAgent can be integrated as a service behind the Apollo Federation Gateway.`);
  console.log(`   This allows other applications to query TerraAgent functionality via GraphQL.`);
  console.log(`   Use the update-gateway-config.ts script to register TerraAgent as a subgraph:`);
  console.log(`   ${colors.fg.yellow}./update-gateway-config.ts add terraagent http://localhost:5000/graphql true${colors.reset}`);
  
  console.log(`\n${colors.fg.cyan}2. Direct HTTP Integration:${colors.reset}`);
  console.log(`   Make POST requests to the TerraAgent API endpoint:`);
  console.log(`   Endpoint: ${colors.fg.green}http://localhost:5000/api/query${colors.reset}`);
  console.log(`   Request body:`);
  console.log(`   ${colors.fg.yellow}{
     "query": "Your natural language query",
     "type": "general | levy | trends | dbatools | rag"
   }${colors.reset}`);
  
  console.log(`\n${colors.fg.cyan}3. Shared UI Components:${colors.reset}`);
  console.log(`   TerraAgent components can be embedded in other applications using the shared UI library:`);
  console.log(`   ${colors.fg.yellow}import { PACSQueryInput } from '@terra/ui';${colors.reset}`);
  
  console.log(`\n${colors.fg.cyan}4. Event-Based Communication:${colors.reset}`);
  console.log(`   TerraAgent publishes events that other applications can subscribe to:`);
  console.log(`   Topics: ${colors.fg.green}terra.agent.query, terra.agent.result${colors.reset}`);
  
  console.log(`\n${colors.fg.cyan}5. Database Integration:${colors.reset}`);
  console.log(`   TerraAgent shares the same database with other applications, allowing for data sharing.`);
}

/**
 * Show TerraAgent API reference
 */
function showTerraAgentApiReference() {
  console.log(`\n${colors.fg.cyan}${colors.bright}TerraAgent API Reference${colors.reset}\n`);
  
  console.log(`${colors.fg.white}TerraAgent exposes the following HTTP APIs:${colors.reset}`);
  
  console.log(`\n${colors.fg.cyan}1. Process Query${colors.reset}`);
  console.log(`   ${colors.fg.yellow}POST /api/query${colors.reset}`);
  console.log(`   
   Request body:
   {
     "query": "String - The natural language query to process",
     "type": "String - Query type (general, levy, trends, dbatools, rag)",
     "parcel_record": "Object - (Optional) Parcel data for levy calculations",
     "tax_rate": "Number - (Optional) Tax rate for levy calculations",
     "exemptions": "Array - (Optional) List of exemptions for levy calculations"
   }
   
   Response:
   {
     "result": "String - The query result or processed data",
     "error": "String - Error message if an error occurred (optional)"
   }`);
  
  console.log(`\n${colors.fg.cyan}2. Reset Chat History${colors.reset}`);
  console.log(`   ${colors.fg.yellow}POST /api/reset_chat${colors.reset}`);
  console.log(`   
   Request body: {}
   
   Response:
   {
     "status": "String - 'success' if successful"
   }`);
  
  console.log(`\n${colors.fg.cyan}3. Web UI${colors.reset}`);
  console.log(`   ${colors.fg.yellow}GET /${colors.reset} - Main web interface`);
  console.log(`   ${colors.fg.yellow}GET /dashboard${colors.reset} - Admin dashboard`);
  
  console.log(`\n${colors.fg.cyan}Query Types:${colors.reset}`);
  console.log(`  - ${colors.fg.green}general:${colors.reset} Natural language to SQL conversion using PACSAgent`);
  console.log(`  - ${colors.fg.green}levy:${colors.reset} Property tax levy calculations`);
  console.log(`  - ${colors.fg.green}trends:${colors.reset} Neighborhood trend analysis`);
  console.log(`  - ${colors.fg.green}dbatools:${colors.reset} Database administration utilities`);
  console.log(`  - ${colors.fg.green}rag:${colors.reset} Retrieval-augmented generation with chat history`);
}

/**
 * Main function
 */
async function main() {
  console.log(`\n${colors.fg.cyan}${colors.bright}================================${colors.reset}`);
  console.log(`${colors.fg.cyan}${colors.bright} TerraFusion Applications Guide ${colors.reset}`);
  console.log(`${colors.fg.cyan}${colors.bright}================================${colors.reset}`);
  
  let running = true;
  
  while (running) {
    const mainChoice = await displayMenu('Select an Application', mainMenuOptions);
    
    switch (mainChoice) {
      case 'terraagent':
        let terraAgentMenuRunning = true;
        while (terraAgentMenuRunning) {
          const terraAgentChoice = await displayMenu('TerraAgent - AI Assistant', terraAgentOptions);
          
          switch (terraAgentChoice) {
            case 'overview':
              showTerraAgentOverview();
              break;
            case 'structure':
              showTerraAgentStructure();
              break;
            case 'run':
              showTerraAgentRunGuide();
              break;
            case 'integrate':
              showTerraAgentIntegrationGuide();
              break;
            case 'api':
              showTerraAgentApiReference();
              break;
            case 'back':
              terraAgentMenuRunning = false;
              break;
            default:
              break;
          }
          
          if (terraAgentMenuRunning) {
            await askQuestion('\nPress Enter to continue...');
          }
        }
        break;
        
      case 'terraflow':
        console.log('\nTerraFlow documentation coming soon...');
        await askQuestion('\nPress Enter to continue...');
        break;
        
      case 'terrafusionpro':
        console.log('\nTerraFusion Pro documentation coming soon...');
        await askQuestion('\nPress Enter to continue...');
        break;
        
      case 'bcbslevy':
        console.log('\nBCBS Levy Calculator documentation coming soon...');
        await askQuestion('\nPress Enter to continue...');
        break;
        
      case 'exit':
        console.log('\nExiting TerraFusion Applications Guide. Goodbye!');
        running = false;
        break;
        
      default:
        break;
    }
  }
  
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});