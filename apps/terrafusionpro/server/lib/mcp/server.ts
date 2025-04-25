import { 
  MCPMessage, 
  MCPResponseMessage, 
  MCPContentTypes,
  MCPContentTypeMap,
  createMCPResponse
} from './types';
import { MCPClient } from './client';

/**
 * MCP Server for handling messages from multiple clients
 */
export class MCPServer {
  private serverId: string;
  private clients: Map<string, MCPClient> = new Map();
  private handlers: Map<string, (message: MCPMessage<any>) => Promise<any>> = new Map();
  
  /**
   * Create a new MCP server
   * @param serverId - Unique identifier for this server
   */
  constructor(serverId: string = 'mcp-server') {
    this.serverId = serverId;
  }
  
  /**
   * Register a client with this server
   * @param client - Client to register
   * @param clientId - ID of the client
   */
  registerClient(client: MCPClient, clientId: string): void {
    this.clients.set(clientId, client);
  }
  
  /**
   * Register a handler for a specific content type
   * @param contentType - Content type to handle
   * @param handler - Function to handle messages of this content type
   */
  registerHandler<T extends MCPContentTypes>(
    contentType: T,
    handler: (message: MCPMessage<MCPContentTypeMap[T]>) => Promise<MCPContentTypeMap[any]>
  ): void {
    this.handlers.set(contentType, handler as any);
  }
  
  /**
   * Process a message received by the server
   * @param message - Message to process
   * @returns Promise that resolves with the response
   */
  async processMessage(message: MCPMessage<any>): Promise<MCPResponseMessage<any>> {
    console.log(`[MCP Server] Processing message ${message.messageId} of type ${message.contentType}`);
    
    try {
      // Find a handler for this content type
      const handler = this.handlers.get(message.contentType);
      
      if (handler) {
        // Process the message with the handler
        const result = await handler(message);
        
        // Create and return the response
        const response = createMCPResponse(
          message,
          `${message.contentType}.response` as MCPContentTypes,
          result,
          'success'
        );
        
        // If the message had a specific recipient, route the response
        if (message.recipient !== this.serverId && message.recipient !== '*') {
          const targetClient = this.clients.get(message.recipient);
          
          if (targetClient) {
            // Route the response to the target client
            await targetClient.processMessage(response);
          }
        }
        
        return response;
      } else {
        // If the message is for a specific client, forward it
        if (message.recipient !== this.serverId && message.recipient !== '*') {
          const targetClient = this.clients.get(message.recipient);
          
          if (targetClient) {
            // Forward the message to the target client
            await targetClient.processMessage(message);
            return createMCPResponse(
              message,
              `${message.contentType}.response` as MCPContentTypes,
              { forwarded: true },
              'success'
            );
          }
        }
        
        // If we got here, we couldn't handle the message
        console.warn(`[MCP Server] No handler registered for content type ${message.contentType}`);
        
        // Create and return an error response
        return createMCPResponse(
          message,
          MCPContentTypes.ERROR,
          null,
          'error',
          {
            code: 'UNHANDLED_CONTENT_TYPE',
            message: `No handler registered for content type ${message.contentType}`,
          }
        );
      }
    } catch (error) {
      console.error(`[MCP Server] Error processing message: ${error}`);
      
      // Create and return an error response
      return createMCPResponse(
        message,
        MCPContentTypes.ERROR,
        null,
        'error',
        {
          code: 'PROCESSING_ERROR',
          message: error.message,
          details: error
        }
      );
    }
  }
  
  /**
   * Broadcast a message to all registered clients
   * @param contentType - Content type of the message
   * @param content - Content of the message
   * @returns Array of responses from clients
   */
  async broadcast<T extends MCPContentTypes>(
    contentType: T,
    content: MCPContentTypeMap[T]
  ): Promise<MCPResponseMessage<any>[]> {
    const message: MCPMessage<MCPContentTypeMap[T]> = {
      messageId: `${this.serverId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      sender: this.serverId,
      recipient: '*',
      contentType,
      content,
      metadata: {}
    };
    
    const responses: MCPResponseMessage<any>[] = [];
    
    // Process message with all clients
    for (const [clientId, client] of this.clients.entries()) {
      try {
        await client.processMessage(message);
        responses.push(createMCPResponse(
          message,
          `${contentType}.response` as MCPContentTypes,
          { status: 'received' },
          'success'
        ));
      } catch (error) {
        console.error(`[MCP Server] Error broadcasting to client ${clientId}: ${error}`);
        responses.push(createMCPResponse(
          message,
          MCPContentTypes.ERROR,
          null,
          'error',
          {
            code: 'BROADCAST_ERROR',
            message: `Error broadcasting to client ${clientId}: ${error.message}`,
            details: error
          }
        ));
      }
    }
    
    return responses;
  }
}