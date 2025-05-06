#!/usr/bin/env node

/**
 * TerraFusion AI Helper
 * 
 * A simple command-line tool to help use Anthropic's Claude model for
 * developing in the TerraFusion monorepo
 */

import { Anthropic } from '@anthropic-ai/sdk';
import fs from 'fs';
import readline from 'readline';
import path from 'path';

// Initialize the Anthropic client - the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Main function to run the assistant
 */
async function main() {
  console.log('\n===============================================');
  console.log(' TerraFusion AI Helper');
  console.log('===============================================\n');
  console.log('This tool helps you with AI-assisted development in the TerraFusion monorepo.');
  console.log('What would you like help with today?\n');
  console.log('1. Code generation');
  console.log('2. Code explanation');
  console.log('3. Debugging help');
  console.log('4. API integration help');
  console.log('5. Exit\n');

  const choice = await askQuestion('Enter your choice (1-5): ');
  
  switch (choice.trim()) {
    case '1':
      await generateCode();
      break;
    case '2':
      await explainCode();
      break;
    case '3':
      await debugCode();
      break;
    case '4':
      await apiIntegration();
      break;
    case '5':
      console.log('\nExiting TerraFusion AI Helper. Goodbye!');
      rl.close();
      return;
    default:
      console.log('\nInvalid choice. Please try again.');
      await main();
      break;
  }

  rl.close();
}

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
 * Code generation assistant
 */
async function generateCode() {
  console.log('\n=== Code Generation ===\n');
  
  const description = await askQuestion('Describe what you want to generate: ');
  const language = await askQuestion('What programming language? (e.g., JavaScript, Python): ');
  
  console.log('\nGenerating code with Claude...\n');
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `
Generate code for the following requirement:
${description}

Language: ${language}

This is for the TerraFusion monorepo project. Please provide well-structured, commented code that follows best practices.
Include example usage if applicable.
          `
        }
      ]
    });
    
    const generatedContent = response.content[0].text;
    console.log(generatedContent);
    
    const saveToFile = await askQuestion('\nSave this code to a file? (y/n): ');
    
    if (saveToFile.toLowerCase() === 'y') {
      const filePath = await askQuestion('Enter file path: ');
      
      // Create directory if it doesn't exist
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Extract code blocks from the response
      const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)```/g;
      let match;
      let code = '';
      
      while ((match = codeBlockRegex.exec(generatedContent)) !== null) {
        code += match[1] + '\n\n';
      }
      
      // If no code blocks found, use the entire response
      if (code.trim() === '') {
        code = generatedContent;
      }
      
      fs.writeFileSync(filePath, code);
      console.log(`\nCode saved to ${filePath}`);
    }
  } catch (error) {
    console.error(`Error generating code: ${error.message}`);
  }
}

/**
 * Code explanation assistant
 */
async function explainCode() {
  console.log('\n=== Code Explanation ===\n');
  
  const filePath = await askQuestion('Enter path to the file you want to understand: ');
  
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return;
    }
    
    const code = fs.readFileSync(filePath, 'utf8');
    
    console.log('\nAnalyzing code with Claude...\n');
    
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `
Please explain this ${path.extname(filePath).substring(1)} code in detail:

\`\`\`
${code}
\`\`\`

Focus on:
1. What the code does
2. Key functions and their purpose
3. How it integrates with other parts of the system
4. Any potential issues or improvements
          `
        }
      ]
    });
    
    console.log(response.content[0].text);
  } catch (error) {
    console.error(`Error explaining code: ${error.message}`);
  }
}

/**
 * Debugging assistant
 */
async function debugCode() {
  console.log('\n=== Debugging Help ===\n');
  
  const description = await askQuestion('Describe the issue you\'re facing: ');
  const code = await askQuestion('Paste the problematic code (press Enter twice when done):\n');
  const error = await askQuestion('\nPaste any error messages (press Enter twice when done):\n');
  
  console.log('\nAnalyzing issue with Claude...\n');
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `
I need help debugging an issue in my TerraFusion monorepo project:

Problem description:
${description}

Code:
\`\`\`
${code}
\`\`\`

Error message:
\`\`\`
${error}
\`\`\`

Please help me:
1. Identify the likely cause of the problem
2. Suggest a solution
3. Provide fixed code if possible
          `
        }
      ]
    });
    
    console.log(response.content[0].text);
  } catch (error) {
    console.error(`Error getting debugging help: ${error.message}`);
  }
}

/**
 * API integration assistant
 */
async function apiIntegration() {
  console.log('\n=== API Integration Help ===\n');
  
  const apiName = await askQuestion('Which API are you working with? ');
  const taskDescription = await askQuestion('What are you trying to accomplish? ');
  
  console.log('\nGenerating integration code with Claude...\n');
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `
I need help integrating with the ${apiName} API in my TerraFusion monorepo project.

What I'm trying to accomplish:
${taskDescription}

Please provide:
1. Example code for the integration
2. Explanation of key API endpoints and parameters
3. Error handling best practices
4. Any configuration needed
          `
        }
      ]
    });
    
    console.log(response.content[0].text);
  } catch (error) {
    console.error(`Error getting API integration help: ${error.message}`);
  }
}

// Run the main function
main().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});