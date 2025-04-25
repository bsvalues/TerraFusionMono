import { 
  Agent, 
  AgentTask, 
  AgentResult, 
  AgentWorkflow,
  AgentWorkflowTask,
  WorkflowResult,
  AgentTaskTypes
} from './types';

/**
 * Agent Coordinator
 * 
 * Manages communication and task delegation between specialized agents.
 * Coordinates complex workflows involving multiple agents.
 */
export class AgentCoordinator {
  private agents: Map<string, Agent> = new Map();
  private taskTypeToAgents: Map<string, Agent[]> = new Map();
  private activeWorkflows: Map<string, {
    workflow: AgentWorkflow,
    results: Record<string, AgentResult<any>>,
    pendingTasks: Set<string>,
    readyTasks: Set<string>,
    completedTasks: Set<string>,
    failedTasks: Set<string>
  }> = new Map();
  
  /**
   * Register an agent with the coordinator
   * @param agent - Agent to register
   */
  registerAgent(agent: Agent): void {
    console.log(`[Agent Coordinator] Registering agent "${agent.name}" (${agent.agentId})`);
    
    // Store the agent
    this.agents.set(agent.agentId, agent);
    
    // Index the agent by its capabilities
    for (const capability of agent.capabilities) {
      const agents = this.taskTypeToAgents.get(capability) || [];
      agents.push(agent);
      this.taskTypeToAgents.set(capability, agents);
    }
  }
  
  /**
   * Find agents capable of handling a specific task type
   * @param taskType - Type of task to handle
   * @returns Array of capable agents
   */
  findCapableAgents(taskType: string): Agent[] {
    return this.taskTypeToAgents.get(taskType) || [];
  }
  
  /**
   * Execute a single task
   * @param task - Task to execute
   * @returns Result of the task
   */
  async executeTask<T, R>(task: AgentTask<T>): Promise<AgentResult<R>> {
    console.log(`[Agent Coordinator] Executing task "${task.taskType}" (${task.taskId})`);
    
    // Find capable agents
    const capableAgents = this.findCapableAgents(task.taskType);
    
    if (capableAgents.length === 0) {
      console.warn(`[Agent Coordinator] No capable agent found for task type "${task.taskType}"`);
      return {
        taskId: task.taskId,
        agentId: 'coordinator',
        status: 'failed',
        error: `No capable agent found for task type "${task.taskType}"`,
        confidence: 0,
        processingTime: 0
      };
    }
    
    // For now, simply use the first capable agent
    // In a more advanced implementation, we could:
    // 1. Choose based on agent performance history
    // 2. Use load balancing
    // 3. Run the task on multiple agents and combine results
    const selectedAgent = capableAgents[0];
    
    const startTime = Date.now();
    try {
      console.log(`[Agent Coordinator] Delegating task to agent "${selectedAgent.name}" (${selectedAgent.agentId})`);
      const result = await selectedAgent.processTask<T, R>(task);
      
      return {
        ...result,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error(`[Agent Coordinator] Error executing task: ${error}`);
      return {
        taskId: task.taskId,
        agentId: selectedAgent.agentId,
        status: 'failed',
        error: error.message,
        confidence: 0,
        processingTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Start a workflow
   * @param workflow - Workflow to execute
   * @returns ID of the workflow
   */
  startWorkflow(workflow: AgentWorkflow): string {
    console.log(`[Agent Coordinator] Starting workflow "${workflow.name}" (${workflow.workflowId})`);
    
    // Create a unique mapping of task definitions to IDs
    const taskIdMap = new Map<AgentWorkflowTask, string>();
    workflow.tasks.forEach((task, index) => {
      taskIdMap.set(task, `${workflow.workflowId}-task-${index}`);
    });
    
    // Initialize the workflow state
    const workflowState = {
      workflow,
      results: {},
      pendingTasks: new Set<string>(),
      readyTasks: new Set<string>(),
      completedTasks: new Set<string>(),
      failedTasks: new Set<string>()
    };
    
    // Determine which tasks are initially ready (no dependencies)
    workflow.tasks.forEach((task, index) => {
      const taskId = taskIdMap.get(task);
      if (task.dependencies.length === 0) {
        workflowState.readyTasks.add(taskId);
      } else {
        workflowState.pendingTasks.add(taskId);
      }
    });
    
    // Store the workflow state
    this.activeWorkflows.set(workflow.workflowId, workflowState);
    
    // Start processing the workflow
    this.processWorkflow(workflow.workflowId);
    
    return workflow.workflowId;
  }
  
  /**
   * Process a workflow
   * @param workflowId - ID of the workflow to process
   */
  private async processWorkflow(workflowId: string): Promise<void> {
    const workflowState = this.activeWorkflows.get(workflowId);
    
    if (!workflowState) {
      console.error(`[Agent Coordinator] Workflow ${workflowId} not found`);
      return;
    }
    
    console.log(`[Agent Coordinator] Processing workflow "${workflowState.workflow.name}" (${workflowId})`);
    console.log(`[Agent Coordinator] Ready tasks: ${workflowState.readyTasks.size}, Pending tasks: ${workflowState.pendingTasks.size}`);
    
    // Process all ready tasks
    const readyTasks = Array.from(workflowState.readyTasks);
    workflowState.readyTasks.clear();
    
    // Execute each ready task
    const taskPromises = readyTasks.map(async taskId => {
      // Find the task definition
      const taskIndex = parseInt(taskId.split('-').pop());
      const taskDef = workflowState.workflow.tasks[taskIndex];
      
      // Create the task
      const task: AgentTask<any> = {
        taskId,
        taskType: taskDef.taskDefinition.taskType,
        priority: taskDef.taskDefinition.priority,
        data: taskDef.taskDefinition.data,
        requester: 'workflow-coordinator',
        deadline: taskDef.taskDefinition.deadline,
        contextId: workflowState.workflow.contextId,
        metadata: taskDef.taskDefinition.metadata
      };
      
      // Execute the task
      try {
        const result = await this.executeTask(task);
        
        // Store the result
        workflowState.results[taskId] = result;
        
        // Update task status
        if (result.status === 'completed') {
          workflowState.completedTasks.add(taskId);
        } else {
          // Handle task failure based on fallback strategy
          if (taskDef.optional) {
            console.log(`[Agent Coordinator] Optional task ${taskId} failed, continuing workflow`);
            workflowState.completedTasks.add(taskId);
          } else if (taskDef.fallbackStrategy === 'skip') {
            console.log(`[Agent Coordinator] Task ${taskId} failed, skipping as per fallback strategy`);
            workflowState.completedTasks.add(taskId);
          } else if (taskDef.fallbackStrategy === 'retry') {
            console.log(`[Agent Coordinator] Task ${taskId} failed, retrying as per fallback strategy`);
            workflowState.readyTasks.add(taskId);
          } else if (taskDef.fallbackStrategy === 'substitute' && taskDef.fallbackTaskDefinition) {
            console.log(`[Agent Coordinator] Task ${taskId} failed, substituting fallback task`);
            
            // Create the fallback task
            const fallbackTask: AgentTask<any> = {
              taskId: `${taskId}-fallback`,
              taskType: taskDef.fallbackTaskDefinition.taskType,
              priority: taskDef.fallbackTaskDefinition.priority,
              data: taskDef.fallbackTaskDefinition.data,
              requester: 'workflow-coordinator',
              deadline: taskDef.fallbackTaskDefinition.deadline,
              contextId: workflowState.workflow.contextId,
              metadata: taskDef.fallbackTaskDefinition.metadata
            };
            
            // Execute the fallback task
            const fallbackResult = await this.executeTask(fallbackTask);
            
            // Store the fallback result
            workflowState.results[taskId] = fallbackResult;
            
            if (fallbackResult.status === 'completed') {
              workflowState.completedTasks.add(taskId);
            } else {
              workflowState.failedTasks.add(taskId);
            }
          } else {
            workflowState.failedTasks.add(taskId);
          }
        }
      } catch (error) {
        console.error(`[Agent Coordinator] Error executing task ${taskId}: ${error}`);
        workflowState.failedTasks.add(taskId);
      }
    });
    
    // Wait for all tasks to complete
    await Promise.all(taskPromises);
    
    // Update the workflow state
    this.activeWorkflows.set(workflowId, workflowState);
    
    // Check if any pending tasks are now ready
    let newReadyTasks = false;
    
    for (const taskId of workflowState.pendingTasks) {
      const taskIndex = parseInt(taskId.split('-').pop());
      const taskDef = workflowState.workflow.tasks[taskIndex];
      
      // Check if all dependencies are completed
      const allDependenciesMet = taskDef.dependencies.every(depIndex => {
        const depTaskId = `${workflowId}-task-${depIndex}`;
        return workflowState.completedTasks.has(depTaskId);
      });
      
      if (allDependenciesMet) {
        workflowState.readyTasks.add(taskId);
        workflowState.pendingTasks.delete(taskId);
        newReadyTasks = true;
      }
    }
    
    // If there are new ready tasks, continue processing
    if (newReadyTasks) {
      this.processWorkflow(workflowId);
    } else if (workflowState.pendingTasks.size === 0 && workflowState.readyTasks.size === 0) {
      // All tasks are either completed or failed, workflow is done
      this.finalizeWorkflow(workflowId);
    }
  }
  
  /**
   * Finalize a workflow
   * @param workflowId - ID of the workflow to finalize
   */
  private finalizeWorkflow(workflowId: string): void {
    const workflowState = this.activeWorkflows.get(workflowId);
    
    if (!workflowState) {
      console.error(`[Agent Coordinator] Cannot finalize workflow ${workflowId}, not found`);
      return;
    }
    
    console.log(`[Agent Coordinator] Finalizing workflow "${workflowState.workflow.name}" (${workflowId})`);
    console.log(`[Agent Coordinator] Completed tasks: ${workflowState.completedTasks.size}, Failed tasks: ${workflowState.failedTasks.size}`);
    
    // Determine overall workflow status
    const allTasksCompleted = workflowState.failedTasks.size === 0;
    const status = allTasksCompleted ? 'completed' : (workflowState.completedTasks.size > 0 ? 'partial' : 'failed');
    
    // Remove the workflow from active workflows
    this.activeWorkflows.delete(workflowId);
    
    // Notify any listeners that the workflow is complete
    this.onWorkflowComplete({
      workflowId,
      status,
      results: workflowState.results,
      processingTime: 0, // Would calculate this in a real implementation
      metadata: workflowState.workflow.metadata
    });
  }
  
  /**
   * Get the current status of a workflow
   * @param workflowId - ID of the workflow
   * @returns Current status of the workflow
   */
  getWorkflowStatus(workflowId: string): WorkflowResult<any> | null {
    const workflowState = this.activeWorkflows.get(workflowId);
    
    if (!workflowState) {
      console.warn(`[Agent Coordinator] Workflow ${workflowId} not found`);
      return null;
    }
    
    return {
      workflowId,
      status: 'partial', // Workflow is still in progress
      results: workflowState.results,
      processingTime: 0, // Would calculate this in a real implementation
      metadata: workflowState.workflow.metadata
    };
  }
  
  /**
   * Event handler for workflow completion
   * @param result - Result of the completed workflow
   */
  protected onWorkflowComplete(result: WorkflowResult<any>): void {
    console.log(`[Agent Coordinator] Workflow ${result.workflowId} completed with status ${result.status}`);
    // This method can be overridden by subclasses to handle workflow completion
  }
}