/**
 * WebSocket Test Client
 * 
 * This script tests WebSocket connections from Node.js to verify connectivity.
 * It's useful for debugging WebSocket issues in the Replit environment.
 * 
 * Usage:
 *   node test-websocket-client.js [url]
 * 
 * If no URL is provided, it will attempt to connect to the current Replit environment.
 */

const WebSocket = require('ws');
const os = require('os');
const https = require('https');

// Get command line arguments
const args = process.argv.slice(2);
let url = args[0];

// If no URL is provided, try to determine it from environment
if (!url) {
  // Check if we're in a Replit environment
  const isReplit = process.env.REPL_ID && process.env.REPL_SLUG;
  
  if (isReplit) {
    // Get the Replit hostname
    const replitDomain = process.env.REPLIT_DOMAINS 
      ? JSON.parse(process.env.REPLIT_DOMAINS)[0] 
      : null;
    
    if (replitDomain) {
      url = `wss://${replitDomain}`;
      console.log(`Running in Replit environment, using URL: ${url}`);
    } else {
      console.error('Could not determine Replit domain.');
      process.exit(1);
    }
  } else {
    // Default to localhost
    url = 'ws://localhost:3000';
    console.log(`Running outside Replit, using default URL: ${url}`);
  }
}

console.log(`Connecting to WebSocket server at ${url}...`);

// Create WebSocket connection
const ws = new WebSocket(url);

// Connection opened
ws.on('open', () => {
  console.log('✅ Connected to WebSocket server!');
  console.log('Sending test message...');
  
  // Send a test message
  ws.send(JSON.stringify({
    type: 'test',
    message: 'Hello from WebSocket test client!',
    timestamp: new Date().toISOString(),
    environment: {
      hostname: os.hostname(),
      platform: os.platform(),
      uptime: os.uptime()
    }
  }));
  
  // Set a timeout to close the connection after 5 seconds
  setTimeout(() => {
    console.log('Test complete, closing connection...');
    ws.close();
  }, 5000);
});

// Listen for messages
ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('📣 Received message:', message);
  } catch (e) {
    console.log('📣 Received non-JSON message:', data.toString());
  }
});

// Error handling
ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  
  // Try to determine if this is a TLS/certificate issue
  if (error.message.includes('certificate') || error.message.includes('SSL')) {
    console.log('\nThis appears to be a TLS/certificate issue.');
    console.log('For Replit connections, make sure you\'re using "wss://" (WebSocket Secure).');
  }
  
  // Check if the host is reachable via HTTPS
  if (url.startsWith('wss://')) {
    const httpsUrl = 'https://' + url.substring(6);
    console.log(`\nTrying to reach the server via HTTPS: ${httpsUrl}`);
    
    https.get(httpsUrl, (res) => {
      console.log(`HTTPS connection successful (status code: ${res.statusCode})`);
      console.log('This suggests the server is reachable, but the WebSocket endpoint may not be configured correctly.');
    }).on('error', (httpsErr) => {
      console.log(`HTTPS connection failed: ${httpsErr.message}`);
      console.log('This suggests the server might not be running or is not accessible.');
    });
  }
});

// Handle close event
ws.on('close', (code, reason) => {
  console.log(`Connection closed with code ${code}${reason ? ` and reason: ${reason}` : ''}`);
  process.exit(0);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Terminating WebSocket connection...');
  ws.close();
  process.exit(0);
});