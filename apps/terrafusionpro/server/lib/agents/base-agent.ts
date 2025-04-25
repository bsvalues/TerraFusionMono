import { 
  Agent, 
  AgentTask, 
  AgentResult,
  AgentTaskTypes
} from './types';

/**
 * Base Agent
 * 
 * Abstract base class that all specialized agents should extend.
 * Provides common functionality and structure for agents.
 */
export abstract class BaseAgent implements Agent {
  agentId: string;
  name: string;
  description: string;
  capabilities: string[];
  
  /**
   * Create a new BaseAgent
   * @param agentId - Unique ID for this agent
   * @param name - Human-readable name for this agent
   * @param description - Description of what this agent does
   * @param capabilities - List of task types this agent can handle
   */
  constructor(
    agentId: string,
    name: string,
    description: string,
    capabilities: string[]
  ) {
    this.agentId = agentId;
    this.name = name;
    this.description = description;
    this.capabilities = capabilities;
  }
  
  /**
   * Check if this agent can handle a specific task
   * @param task - Task to check
   * @returns True if this agent can handle the task
   */
  canHandle(task: AgentTask<any>): boolean {
    return this.capabilities.includes(task.taskType);
  }
  
  /**
   * Process a task
   * @param task - Task to process
   * @returns Result of the task
   */
  async processTask<T, R>(task: AgentTask<T>): Promise<AgentResult<R>> {
    // Validate that we can handle this task
    if (!this.canHandle(task)) {
      return {
        taskId: task.taskId,
        agentId: this.agentId,
        status: 'failed',
        error: `Agent ${this.name} cannot handle task type ${task.taskType}`,
        confidence: 0,
        processingTime: 0
      };
    }
    
    console.log(`[${this.name}] Processing task "${task.taskType}" (${task.taskId})`);
    
    const startTime = Date.now();
    
    try {
      // Call the appropriate handler for this task type
      const result = await this.handleTask<T, R>(task);
      
      const processingTime = Date.now() - startTime;
      
      return {
        taskId: task.taskId,
        agentId: this.agentId,
        status: 'completed',
        result,
        confidence: 0.9, // Default confidence, should be overridden by specific implementations
        processingTime
      };
    } catch (error) {
      console.error(`[${this.name}] Error processing task: ${error}`);
      
      return {
        taskId: task.taskId,
        agentId: this.agentId,
        status: 'failed',
        error: error.message,
        confidence: 0,
        processingTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Handle a task based on its type
   * This should be implemented by derived classes
   * @param task - Task to handle
   * @returns Result of the task
   */
  protected abstract handleTask<T, R>(task: AgentTask<T>): Promise<R>;
}