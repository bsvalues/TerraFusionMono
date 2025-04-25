import { 
  MCPMessage, 
  MCPResponseMessage, 
  MCPContentTypes,
  MCPContentTypeMap,
  createMCPMessage,
  createMCPResponse
} from './types';

/**
 * MCP Client for sending and receiving messages
 */
export class MCPClient {
  private clientId: string;
  private handlers: Map<string, (message: MCPMessage<any>) => Promise<any>> = new Map();
  private pendingResponses: Map<string, {
    resolve: (value: any) => void,
    reject: (reason: any) => void,
    timeout: NodeJS.Timeout
  }> = new Map();
  
  /**
   * Create a new MCP client
   * @param clientId - Unique identifier for this client
   */
  constructor(clientId: string) {
    this.clientId = clientId;
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
   * Send a message and wait for a response
   * @param contentType - Content type of the message
   * @param content - Content of the message
   * @param recipient - ID of the recipient
   * @param timeoutMs - Timeout in milliseconds
   * @returns Promise that resolves with the response message
   */
  async sendAndReceive<T extends MCPContentTypes, R extends MCPContentTypes>(
    contentType: T,
    content: MCPContentTypeMap[T],
    recipient: string,
    timeoutMs: number = 30000
  ): Promise<MCPResponseMessage<MCPContentTypeMap[R]>> {
    const message = createMCPMessage(
      contentType,
      content,
      this.clientId,
      recipient
    );
    
    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingResponses.delete(message.messageId);
        reject(new Error(`Timeout waiting for response to message ${message.messageId}`));
      }, timeoutMs);
      
      // Store the pending response
      this.pendingResponses.set(message.messageId, {
        resolve,
        reject,
        timeout
      });
      
      // Call processMessage as if this message was received
      this.processMessage(message)
        .catch(error => {
          console.error(`Error processing outgoing message: ${error}`);
          // If there was an error processing the message locally,
          // we still keep the pending response as it might be processed externally
        });
    });
  }
  
  /**
   * Send a message without waiting for a response
   * @param contentType - Content type of the message
   * @param content - Content of the message
   * @param recipient - ID of the recipient
   * @returns The message that was sent
   */
  send<T extends MCPContentTypes>(
    contentType: T,
    content: MCPContentTypeMap[T],
    recipient: string
  ): MCPMessage<MCPContentTypeMap[T]> {
    const message = createMCPMessage(
      contentType,
      content,
      this.clientId,
      recipient
    );
    
    // Call processMessage as if this message was received
    this.processMessage(message)
      .catch(error => {
        console.error(`Error processing outgoing message: ${error}`);
      });
    
    return message;
  }
  
  /**
   * Receive and process a message
   * @param message - Message to process
   * @returns Promise that resolves when message is processed
   */
  async processMessage(message: MCPMessage<any>): Promise<void> {
    console.log(`[MCP] Processing message ${message.messageId} of type ${message.contentType}`);
    
    // Check if this is a response to a message we sent
    if ('inResponseTo' in message) {
      const responseMessage = message as MCPResponseMessage<any>;
      const pendingResponse = this.pendingResponses.get(responseMessage.inResponseTo);
      
      if (pendingResponse) {
        clearTimeout(pendingResponse.timeout);
        this.pendingResponses.delete(responseMessage.inResponseTo);
        
        if (responseMessage.status === 'error') {
          pendingResponse.reject(responseMessage.errorDetails || { message: 'Unknown error' });
        } else {
          pendingResponse.resolve(responseMessage);
        }
        return;
      }
    }
    
    // If the message is for us, find a handler
    if (message.recipient === this.clientId || message.recipient === '*') {
      const handler = this.handlers.get(message.contentType);
      
      if (handler) {
        try {
          const result = await handler(message);
          
          // Create and send a response
          const response = createMCPResponse(
            message,
            `${message.contentType}.response` as MCPContentTypes,
            result,
            'success'
          );
          
          // If this is a local message, the response needs to be processed locally too
          this.processMessage(response)
            .catch(error => {
              console.error(`Error processing response message: ${error}`);
            });
        } catch (error) {
          // Create and send an error response
          const response = createMCPResponse(
            message,
            MCPContentTypes.ERROR,
            null,
            'error',
            {
              code: 'HANDLER_ERROR',
              message: error.message,
              details: error
            }
          );
          
          // If this is a local message, the response needs to be processed locally too
          this.processMessage(response)
            .catch(error => {
              console.error(`Error processing error response message: ${error}`);
            });
        }
      } else {
        console.warn(`[MCP] No handler registered for content type ${message.contentType}`);
        
        // Create and send an error response for unhandled content type
        const response = createMCPResponse(
          message,
          MCPContentTypes.ERROR,
          null,
          'error',
          {
            code: 'UNHANDLED_CONTENT_TYPE',
            message: `No handler registered for content type ${message.contentType}`,
          }
        );
        
        // If this is a local message, the response needs to be processed locally too
        this.processMessage(response)
          .catch(error => {
            console.error(`Error processing unhandled content type response: ${error}`);
          });
      }
    }
  }
}