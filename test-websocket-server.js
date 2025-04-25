/**
 * Advanced WebSocket Test Server
 * 
 * This server provides a way to test WebSocket connections in the Replit environment.
 * It includes detailed logging, authentication, and both raw and JSON message handling.
 * 
 * Usage:
 *   node test-websocket-server.js [port]
 */

const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const os = require('os');

// Get port from command-line arguments or use default
const PORT = process.argv[2] || process.env.PORT || 3001;

// Create HTTP server to handle upgrades
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Serve a simple HTML test page
  if (parsedUrl.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WebSocket Test</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
          .container { max-width: 800px; margin: 0 auto; }
          .logs { background: #f3f3f3; border: 1px solid #ddd; padding: 10px; height: 300px; overflow-y: auto; font-family: monospace; }
          button, input { padding: 8px; margin: 5px; }
          h1, h2 { color: #333; }
          .connected { color: green; }
          .disconnected { color: red; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>WebSocket Test Client</h1>
          <p>Status: <span id="status" class="disconnected">Disconnected</span></p>
          
          <div>
            <button id="connect">Connect</button>
            <button id="disconnect" disabled>Disconnect</button>
          </div>
          
          <h2>Send Message</h2>
          <div>
            <input id="message" type="text" placeholder="Message to send..." style="width: 70%">
            <button id="send" disabled>Send</button>
          </div>
          
          <h2>Log</h2>
          <div id="log" class="logs"></div>
        </div>
        
        <script>
          const statusEl = document.getElementById('status');
          const connectBtn = document.getElementById('connect');
          const disconnectBtn = document.getElementById('disconnect');
          const messageInput = document.getElementById('message');
          const sendBtn = document.getElementById('send');
          const logEl = document.getElementById('log');
          
          let socket;
          
          function log(message, type = 'info') {
            const date = new Date().toISOString();
            logEl.innerHTML += `<div class="\${type}">\${date}: \${message}</div>`;
            logEl.scrollTop = logEl.scrollHeight;
          }
          
          connectBtn.addEventListener('click', () => {
            // Determine WebSocket URL based on the current page
            const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `\${protocol}//${location.host}/ws`;
            
            log(\`Connecting to \${wsUrl}...\`);
            
            try {
              socket = new WebSocket(wsUrl);
              
              socket.onopen = () => {
                statusEl.textContent = 'Connected';
                statusEl.className = 'connected';
                connectBtn.disabled = true;
                disconnectBtn.disabled = false;
                sendBtn.disabled = false;
                log('Connection established', 'success');
              };
              
              socket.onmessage = (event) => {
                let message = event.data;
                try {
                  // Try to parse as JSON
                  const parsed = JSON.parse(message);
                  message = JSON.stringify(parsed, null, 2);
                } catch (e) {
                  // Keep as-is if not JSON
                }
                log(\`Received: \${message}\`, 'received');
              };
              
              socket.onclose = (event) => {
                statusEl.textContent = \`Disconnected (code: \${event.code})\`;
                statusEl.className = 'disconnected';
                connectBtn.disabled = false;
                disconnectBtn.disabled = true;
                sendBtn.disabled = true;
                log(\`Connection closed with code \${event.code}\`, 'error');
              };
              
              socket.onerror = (error) => {
                log(\`Error: \${error.message || 'Unknown error'}\`, 'error');
              };
            } catch (e) {
              log(\`Connection error: \${e.message}\`, 'error');
            }
          });
          
          disconnectBtn.addEventListener('click', () => {
            if (socket) {
              socket.close(1000, 'User disconnected');
            }
          });
          
          sendBtn.addEventListener('click', () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              const message = messageInput.value;
              if (message) {
                log(\`Sent: \${message}\`, 'sent');
                socket.send(message);
                messageInput.value = '';
              }
            }
          });
          
          messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              sendBtn.click();
            }
          });
          
          // Log page load
          log('Test client loaded', 'info');
          
          // Log environment information
          log(\`Current URL: \${location.href}\`, 'info');
          log(\`Using \${navigator.userAgent}\`, 'info');
        </script>
      </body>
      </html>
    `);
    return;
  }
  
  // Serve a simple health check endpoint
  if (parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now()
    }));
    return;
  }
  
  // Return a 404 for any other requests
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found\n');
});

// Create WebSocket server with path
const wss = new WebSocket.Server({ 
  server,
  path: '/ws',
  // Add a simple verification function for token authentication
  verifyClient: (info) => {
    const parsedUrl = url.parse(info.req.url, true);
    const token = parsedUrl.query.token;
    
    // If no token required, allow all connections
    if (!process.env.REQUIRE_TOKEN) {
      return true;
    }
    
    // If token is provided, check it against environment variable
    return token && token === process.env.WS_AUTH_TOKEN;
  }
});

// Track active connections
const clients = new Set();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  // Add to client set
  clients.add(ws);
  
  // Extract client info
  const clientIp = req.socket.remoteAddress;
  const parsedUrl = url.parse(req.url, true);
  const clientHeaders = req.headers;
  const token = parsedUrl.query.token;
  
  console.log(`[${new Date().toISOString()}] New connection from ${clientIp}`);
  console.log(`[${new Date().toISOString()}] Active connections: ${clients.size}`);
  
  if (token) {
    console.log(`[${new Date().toISOString()}] Client provided token`);
  }
  
  // Send a welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to WebSocket Test Server',
    timestamp: new Date().toISOString(),
    clientInfo: {
      ip: clientIp,
      userAgent: clientHeaders['user-agent'] || 'Unknown',
      host: clientHeaders.host || 'Unknown'
    },
    serverInfo: {
      uptime: process.uptime(),
      hostname: os.hostname(),
      platform: os.platform(),
      nodeVersion: process.version,
      memory: {
        total: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
        free: Math.round(os.freemem() / 1024 / 1024) + ' MB',
      }
    }
  }));
  
  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      // Parse as JSON if possible
      let data = message.toString();
      let isJson = false;
      let parsedData;
      
      try {
        parsedData = JSON.parse(data);
        isJson = true;
        console.log(`[${new Date().toISOString()}] Received JSON: ${JSON.stringify(parsedData)}`);
      } catch (e) {
        console.log(`[${new Date().toISOString()}] Received text: ${data}`);
      }
      
      // Handle different types of messages
      if (isJson && parsedData.type) {
        switch (parsedData.type) {
          case 'ping':
            // Respond to ping with pong
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString(),
              echo: parsedData
            }));
            break;
            
          case 'broadcast':
            // Broadcast to all clients
            const broadcastMsg = JSON.stringify({
              type: 'broadcast',
              sender: clientIp,
              message: parsedData.message || 'Empty broadcast',
              timestamp: new Date().toISOString()
            });
            
            clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(broadcastMsg);
              }
            });
            break;
            
          case 'echo':
            // Echo back the message
            ws.send(JSON.stringify({
              type: 'echo',
              original: parsedData,
              timestamp: new Date().toISOString()
            }));
            break;
            
          default:
            // Default echo for unknown types
            ws.send(JSON.stringify({
              type: 'response',
              originalType: parsedData.type,
              message: `Received message of type: ${parsedData.type}`,
              timestamp: new Date().toISOString()
            }));
        }
      } else {
        // Echo back non-JSON or JSON without type
        ws.send(`Echo: ${data}`);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error handling message:`, error);
      ws.send(JSON.stringify({
        type: 'error',
        message: `Error processing message: ${error.message}`,
        timestamp: new Date().toISOString()
      }));
    }
  });
  
  // Handle connection closing
  ws.on('close', (code, reason) => {
    clients.delete(ws);
    console.log(`[${new Date().toISOString()}] Connection closed with code ${code}${reason ? ` and reason: ${reason}` : ''}`);
    console.log(`[${new Date().toISOString()}] Active connections: ${clients.size}`);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] WebSocket error:`, error);
  });
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 WebSocket Test Server running at http://0.0.0.0:${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://0.0.0.0:${PORT}/ws`);
  console.log(`🔍 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🌐 HTML test client: http://0.0.0.0:${PORT}/`);
  
  // Show environment info
  console.log('\n📊 Environment Info:');
  console.log(`  Node.js: ${process.version}`);
  console.log(`  Platform: ${os.platform()} ${os.release()}`);
  console.log(`  Hostname: ${os.hostname()}`);
  
  if (process.env.REPLIT_DOMAINS) {
    console.log('\n🔗 Replit Environment Detected:');
    try {
      const domains = JSON.parse(process.env.REPLIT_DOMAINS);
      if (domains && domains.length > 0) {
        console.log(`  Domain: ${domains[0]}`);
        console.log(`  WebSocket URL: wss://${domains[0]}/ws`);
      }
    } catch (e) {
      console.error('  Error parsing REPLIT_DOMAINS:', e);
    }
  }
  
  if (process.env.REQUIRE_TOKEN) {
    console.log('\n🔐 Authentication Required:');
    console.log(`  Token is required: ${!!process.env.WS_AUTH_TOKEN}`);
  } else {
    console.log('\n🔓 No Authentication Required');
  }
  
  console.log('\n📋 Usage Instructions:');
  console.log('  - Visit the HTML test client to connect and send messages');
  console.log('  - Or connect programmatically using a WebSocket client');
  console.log('  - Send JSON with "type" field for special handling');
  console.log('    - "ping": Get a pong response');
  console.log('    - "echo": Echo back the message');
  console.log('    - "broadcast": Send to all connected clients');
  console.log('\n⏲️  Server started at', new Date().toISOString());
  console.log('----------------------------------------------');
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  
  // Close all WebSocket connections
  wss.clients.forEach(client => {
    client.close(1001, 'Server shutting down');
  });
  
  // Close the HTTP server
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});