/**
 * Agent-to-Agent Protocol Type Definitions
 * 
 * This file defines the core types for the Agent-to-Agent protocol,
 * which allows specialized AI agents to collaborate on complex appraisal tasks.
 */

// Agent interface - defines what an agent can do
export interface Agent {
  agentId: string;
  name: string;
  description: string;
  capabilities: string[];
  processTask<T, R>(task: AgentTask<T>): Promise<AgentResult<R>>;
  canHandle(task: AgentTask<any>): boolean;
}

// Task interface - defines what work needs to be done
export interface AgentTask<T> {
  taskId: string;
  taskType: string;
  priority: number;
  data: T;
  requester: string;
  deadline?: number;
  contextId?: string; // Groups related tasks together
  parentTaskId?: string; // For subtasks
  metadata?: Record<string, any>;
}

// Result interface - defines the outcome of a task
export interface AgentResult<R> {
  taskId: string;
  agentId: string;
  status: 'completed' | 'failed' | 'partial';
  result?: R;
  error?: string;
  confidence: number;
  processingTime: number;
  metadata?: Record<string, any>;
}

// Workflow interface - defines a sequence of tasks
export interface AgentWorkflow {
  workflowId: string;
  name: string;
  description: string;
  tasks: AgentWorkflowTask[];
  contextId: string;
  metadata?: Record<string, any>;
}

// Workflow task - a task within a workflow
export interface AgentWorkflowTask {
  taskDefinition: Omit<AgentTask<any>, 'taskId' | 'requester'>;
  dependencies: string[]; // IDs of tasks that must complete before this one
  optional: boolean;
  fallbackStrategy?: 'skip' | 'retry' | 'substitute';
  fallbackTaskDefinition?: Omit<AgentTask<any>, 'taskId' | 'requester'>;
}

// Workflow result - the outcome of a workflow
export interface WorkflowResult<R> {
  workflowId: string;
  status: 'completed' | 'failed' | 'partial';
  results: Record<string, AgentResult<any>>;
  finalResult?: R;
  error?: string;
  processingTime: number;
  metadata?: Record<string, any>;
}

// Agent capability - what an agent can do
export interface AgentCapability {
  name: string;
  description: string;
  taskTypes: string[];
  parameters: Record<string, {
    type: string;
    description: string;
    required: boolean;
  }>;
  resultSchema: Record<string, {
    type: string;
    description: string;
  }>;
}

// Common task types for real estate appraisal
export enum AgentTaskTypes {
  // Data extraction
  EXTRACT_PROPERTY_DATA = 'extract_property_data',
  EXTRACT_DOCUMENT_DATA = 'extract_document_data',
  EXTRACT_EMAIL_ORDER = 'extract_email_order',
  
  // Property valuation
  ESTIMATE_PROPERTY_VALUE = 'estimate_property_value',
  ANALYZE_COMPARABLES = 'analyze_comparables',
  RECOMMEND_ADJUSTMENTS = 'recommend_adjustments',
  
  // Report generation
  GENERATE_NARRATIVE = 'generate_narrative',
  GENERATE_MARKET_ANALYSIS = 'generate_market_analysis',
  GENERATE_PROPERTY_DESCRIPTION = 'generate_property_description',
  
  // Compliance
  CHECK_UAD_COMPLIANCE = 'check_uad_compliance',
  CHECK_USPAP_COMPLIANCE = 'check_uspap_compliance',
  VALIDATE_REPORT = 'validate_report',
  
  // Research
  RESEARCH_PROPERTY_HISTORY = 'research_property_history',
  RESEARCH_MARKET_CONDITIONS = 'research_market_conditions',
  RESEARCH_ZONING = 'research_zoning'
}