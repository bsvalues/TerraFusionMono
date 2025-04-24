import WebSocket from 'ws';

// Connect to the collaboration WebSocket endpoint
const socket = new WebSocket('ws://localhost:5000/ws/collaboration');

// Handle connection open
socket.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Send a ping message
  const message = {
    type: 'ping',
    timestamp: Date.now()
  };
  
  socket.send(JSON.stringify(message));
  console.log('Sent ping message');
});

// Handle messages from the server
socket.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('Received message:', message);
    
    if (message.type === 'welcome') {
      console.log('Received welcome message with client ID:', message.clientId);
      
      // Try to authenticate
      const authMessage = {
        type: 'auth',
        token: 'demo-token',
        userId: 1,
        username: 'Demo User'
      };
      
      socket.send(JSON.stringify(authMessage));
      console.log('Sent auth message');
    }
    
    if (message.type === 'auth_success') {
      console.log('Authentication successful');
      
      // Try to join a session
      const joinMessage = {
        type: 'join_session',
        sessionId: 'test-session-' + Date.now(),
        username: 'Demo User'
      };
      
      socket.send(JSON.stringify(joinMessage));
      console.log('Sent join session message');
    }
    
    if (message.type === 'initialState') {
      console.log('Joined session successfully');
      
      // Send a test update
      const updateMessage = {
        type: 'presence',
        state: 'active'
      };
      
      socket.send(JSON.stringify(updateMessage));
      console.log('Sent presence update');
      
      // Clean up after 2 seconds
      setTimeout(() => {
        const leaveMessage = {
          type: 'leave_session'
        };
        
        socket.send(JSON.stringify(leaveMessage));
        console.log('Sent leave session message');
        
        // Close the connection after another second
        setTimeout(() => {
          socket.close();
          console.log('Closed connection');
          process.exit(0);
        }, 1000);
      }, 2000);
    }
  } catch (error) {
    console.error('Error parsing message:', error);
  }
});

// Handle errors
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Handle connection close
socket.on('close', () => {
  console.log('Connection closed');
});

// Set a timeout to exit if the connection doesn't work
setTimeout(() => {
  console.log('Timed out waiting for connection');
  process.exit(1);
}, 10000);