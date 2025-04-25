/**
 * AI Orchestrator
 * 
 * This module coordinates the use of various AI services (OpenAI, Anthropic, etc.)
 * and specialized agents to perform complex appraisal tasks. It implements
 * the Multi-AI Orchestration System described in the enhancement plan.
 */

import { AgentCoordinator, AgentTask, AgentTaskTypes } from './agents';
import { DataExtractionAgent } from './agents/data-extraction-agent';
import { MarketAnalysisAgent } from './agents/market-analysis-agent';
import { ValuationAgent } from './agents/valuation-agent';
import { NarrativeAgent } from './agents/narrative-agent';
import { ComplianceAgent } from './agents/compliance-agent';
import { MCPServer, MCPClient, MCPContentTypes } from './mcp';

// Enum for AI providers
export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  AUTO = 'auto' // Automatically select the best provider for the task
}

// Enum for orchestration task types (higher-level than agent task types)
export enum OrchestrationTaskType {
  // Email and document processing
  PROCESS_EMAIL_ORDER = 'process_email_order',
  PROCESS_DOCUMENT = 'process_document',
  
  // Valuation tasks
  AUTOMATED_VALUATION = 'automated_valuation',
  COMPARABLE_SELECTION = 'comparable_selection',
  ADJUSTMENT_CALCULATION = 'adjustment_calculation',
  GENERATE_ADJUSTMENT_MODEL = 'generate_adjustment_model',
  
  // Report generation
  GENERATE_REPORT_SECTION = 'generate_report_section',
  MARKET_ANALYSIS = 'market_analysis',
  
  // Compliance
  CHECK_COMPLIANCE = 'check_compliance',
  VALIDATE_APPRAISAL = 'validate_appraisal'
}

/**
 * AI Orchestrator class
 * 
 * Manages and coordinates multiple AI services and specialized agents
 * to complete complex appraisal tasks.
 */
export class AIOrchestrator {
  private coordinator: AgentCoordinator;
  private mcpServer: MCPServer;
  
  /**
   * Create a new AIOrchestrator
   */
  constructor() {
    // Create agent coordinator
    this.coordinator = new AgentCoordinator();
    
    // Register specialized agents
    this.coordinator.registerAgent(new DataExtractionAgent());
    this.coordinator.registerAgent(new MarketAnalysisAgent());
    this.coordinator.registerAgent(new ValuationAgent());
    this.coordinator.registerAgent(new NarrativeAgent());
    this.coordinator.registerAgent(new ComplianceAgent());
    
    // Create MCP server
    this.mcpServer = new MCPServer('ai-orchestrator');
    
    // Set up listeners to connect the MCP server with the Agent Coordinator
    this.setupMCPListeners();
  }
  
  /**
   * Setup MCP server listeners to translate MCP messages to agent tasks
   */
  private setupMCPListeners(): void {
    // Document extraction
    this.mcpServer.registerHandler(MCPContentTypes.DOCUMENT_EXTRACTION_REQUEST, async (message) => {
      const { documentText, documentType } = message.content as any;
      
      const task: AgentTask<any> = {
        taskId: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        taskType: AgentTaskTypes.EXTRACT_DOCUMENT_DATA,
        priority: 1,
        data: {
          documentContent: documentText,
          documentType
        },
        requester: message.sender
      };
      
      const result = await this.coordinator.executeTask(task);
      return result.result;
    });
    
    // Property valuation
    this.mcpServer.registerHandler(MCPContentTypes.VALUATION_REQUEST, async (message) => {
      const { property, approachType } = message.content as any;
      
      const task: AgentTask<any> = {
        taskId: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        taskType: AgentTaskTypes.ESTIMATE_PROPERTY_VALUE,
        priority: 1,
        data: {
          property,
          approachType: approachType || 'sales_comparison'
        },
        requester: message.sender
      };
      
      const result = await this.coordinator.executeTask(task);
      return result.result;
    });
    
    // Market analysis
    this.mcpServer.registerHandler(MCPContentTypes.MARKET_ANALYSIS_REQUEST, async (message) => {
      const { location, propertyType } = message.content as any;
      
      const task: AgentTask<any> = {
        taskId: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        taskType: AgentTaskTypes.GENERATE_MARKET_ANALYSIS,
        priority: 1,
        data: {
          location,
          propertyType
        },
        requester: message.sender
      };
      
      const result = await this.coordinator.executeTask(task);
      return result.result;
    });
    
    // Narrative generation
    this.mcpServer.registerHandler(MCPContentTypes.NARRATIVE_GENERATION_REQUEST, async (message) => {
      const { section, propertyData, additionalContext } = message.content as any;
      
      const task: AgentTask<any> = {
        taskId: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        taskType: AgentTaskTypes.GENERATE_NARRATIVE,
        priority: 1,
        data: {
          section,
          propertyData,
          additionalContext
        },
        requester: message.sender
      };
      
      const result = await this.coordinator.executeTask(task);
      return result.result;
    });
    
    // Compliance check
    this.mcpServer.registerHandler(MCPContentTypes.COMPLIANCE_CHECK_REQUEST, async (message) => {
      const { reportText, complianceStandards } = message.content as any;
      
      const task: AgentTask<any> = {
        taskId: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        taskType: AgentTaskTypes.CHECK_USPAP_COMPLIANCE,
        priority: 1,
        data: {
          reportText,
          section: 'entire_report'
        },
        requester: message.sender
      };
      
      const result = await this.coordinator.executeTask(task);
      return result.result;
    });
  }
  
  /**
   * Process an incoming email order
   * @param emailContent - Full content of the email
   * @param emailSubject - Subject line of the email (optional)
   * @param senderEmail - Email address of the sender (optional)
   * @param provider - AI provider to use (optional)
   * @returns Extracted property data and any additional information
   */
  async processEmailOrder(
    emailContent: string,
    emailSubject?: string,
    senderEmail?: string,
    provider: AIProvider = AIProvider.AUTO
  ): Promise<any> {
    console.log(`[AI Orchestrator] Processing email order, subject: ${emailSubject || 'N/A'}`);
    
    // If provider is AUTO, determine the best provider for the task
    const selectedProvider = this.selectBestProvider(
      OrchestrationTaskType.PROCESS_EMAIL_ORDER,
      provider
    );
    
    console.log(`[AI Orchestrator] Using ${selectedProvider} for email processing`);
    
    // Create an extraction task
    const task: AgentTask<any> = {
      taskId: `email-task-${Date.now()}`,
      taskType: AgentTaskTypes.EXTRACT_EMAIL_ORDER,
      priority: 1,
      data: {
        emailContent,
        emailSubject,
        senderEmail
      },
      requester: 'system',
      metadata: {
        provider: selectedProvider
      }
    };
    
    // Execute the task using the agent coordinator
    const result = await this.coordinator.executeTask(task);
    
    if (result.status !== 'completed') {
      throw new Error(`Failed to process email order: ${result.error}`);
    }
    
    return result.result;
  }
  
  /**
   * Analyze a property and provide an automated valuation
   * @param propertyData - Property data to analyze
   * @param comparables - Comparable properties (optional)
   * @param provider - AI provider to use (optional)
   * @returns Automated valuation results
   */
  async automatedValuation(
    propertyData: any,
    comparables?: any[],
    provider: AIProvider = AIProvider.AUTO
  ): Promise<any> {
    console.log(`[AI Orchestrator] Performing automated valuation for ${propertyData.address}`);
    
    // If provider is AUTO, determine the best provider for the task
    const selectedProvider = this.selectBestProvider(
      OrchestrationTaskType.AUTOMATED_VALUATION,
      provider
    );
    
    console.log(`[AI Orchestrator] Using ${selectedProvider} for valuation`);
    
    // Create a valuation task
    const task: AgentTask<any> = {
      taskId: `valuation-task-${Date.now()}`,
      taskType: AgentTaskTypes.ESTIMATE_PROPERTY_VALUE,
      priority: 1,
      data: {
        property: propertyData,
        approachType: 'all',
        includeAdjustments: true,
        includeRationale: true
      },
      requester: 'system',
      metadata: {
        provider: selectedProvider
      }
    };
    
    // Execute the task using the agent coordinator
    const result = await this.coordinator.executeTask(task);
    
    if (result.status !== 'completed') {
      throw new Error(`Failed to perform automated valuation: ${result.error}`);
    }
    
    return result.result;
  }
  
  /**
   * Generate an adjustment model for a subject property and its comparables
   * @param subjectProperty - The subject property data
   * @param comparableProperties - Array of comparable properties
   * @param provider - AI provider to use (optional)
   * @returns Adjustment model data with recommendations
   */
  async generateAdjustmentModel(
    subjectProperty: any,
    comparableProperties: any[],
    provider: AIProvider = AIProvider.AUTO
  ): Promise<any> {
    console.log(`[AI Orchestrator] Generating adjustment model for ${subjectProperty.address}`);
    
    // If provider is AUTO, determine the best provider for the task
    const selectedProvider = this.selectBestProvider(
      OrchestrationTaskType.GENERATE_ADJUSTMENT_MODEL,
      provider
    );
    
    console.log(`[AI Orchestrator] Using ${selectedProvider} for adjustment model generation`);
    
    // Create an adjustment model generation task
    const task: AgentTask<any> = {
      taskId: `adjustment-model-task-${Date.now()}`,
      taskType: AgentTaskTypes.ANALYZE_COMPARABLES,
      priority: 1,
      data: {
        subjectProperty,
        comparableProperties,
        generateModel: true,
        includeAdjustmentRecommendations: true
      },
      requester: 'system',
      metadata: {
        provider: selectedProvider
      }
    };
    
    // Execute the task using the agent coordinator
    const result = await this.coordinator.executeTask(task);
    
    if (result.status !== 'completed') {
      throw new Error(`Failed to generate adjustment model: ${result.error}`);
    }
    
    // Return the model structure
    return {
      modelName: `AI Generated Model - ${new Date().toLocaleDateString()}`,
      modelDescription: "Automatically generated adjustment model based on property characteristics and market data",
      parameters: result.result.parameters || {},
      confidence: result.result.confidence || 0.85,
      metadata: result.result.metadata || {},
      adjustments: result.result.adjustments || []
    };
  }

  /**
   * Generate a market analysis for a property location
   * @param location - Location to analyze (city, state, or zip)
   * @param propertyType - Type of property (single family, condo, etc.)
   * @param provider - AI provider to use (optional)
   * @returns Market analysis results
   */
  async generateMarketAnalysis(
    location: string,
    propertyType: string,
    provider: AIProvider = AIProvider.AUTO
  ): Promise<any> {
    console.log(`[AI Orchestrator] Generating market analysis for ${propertyType} in ${location}`);
    
    // If provider is AUTO, determine the best provider for the task
    const selectedProvider = this.selectBestProvider(
      OrchestrationTaskType.MARKET_ANALYSIS,
      provider
    );
    
    console.log(`[AI Orchestrator] Using ${selectedProvider} for market analysis`);
    
    // Create a market analysis task
    const task: AgentTask<any> = {
      taskId: `market-task-${Date.now()}`,
      taskType: AgentTaskTypes.GENERATE_MARKET_ANALYSIS,
      priority: 1,
      data: {
        location,
        propertyType,
        detail: 'detailed'
      },
      requester: 'system',
      metadata: {
        provider: selectedProvider
      }
    };
    
    // Execute the task using the agent coordinator
    const result = await this.coordinator.executeTask(task);
    
    if (result.status !== 'completed') {
      throw new Error(`Failed to generate market analysis: ${result.error}`);
    }
    
    return result.result;
  }
  
  /**
   * Generate a narrative section for an appraisal report
   * @param section - Report section to generate
   * @param propertyData - Property data
   * @param additionalContext - Additional context (optional)
   * @param provider - AI provider to use (optional)
   * @returns Generated narrative text
   */
  async generateNarrativeSection(
    section: 'neighborhood' | 'improvements' | 'site' | 'market_conditions' | 'approach_to_value' | 'reconciliation',
    propertyData: any,
    additionalContext?: string,
    provider: AIProvider = AIProvider.AUTO
  ): Promise<any> {
    console.log(`[AI Orchestrator] Generating ${section} narrative section`);
    
    // If provider is AUTO, determine the best provider for the task
    const selectedProvider = this.selectBestProvider(
      OrchestrationTaskType.GENERATE_REPORT_SECTION,
      provider
    );
    
    console.log(`[AI Orchestrator] Using ${selectedProvider} for narrative generation`);
    
    // Create a narrative generation task
    const task: AgentTask<any> = {
      taskId: `narrative-task-${Date.now()}`,
      taskType: AgentTaskTypes.GENERATE_NARRATIVE,
      priority: 1,
      data: {
        section,
        propertyData,
        additionalContext,
        length: 'standard'
      },
      requester: 'system',
      metadata: {
        provider: selectedProvider
      }
    };
    
    // Execute the task using the agent coordinator
    const result = await this.coordinator.executeTask(task);
    
    if (result.status !== 'completed') {
      throw new Error(`Failed to generate narrative: ${result.error}`);
    }
    
    return result.result;
  }
  
  /**
   * Check USPAP compliance for an appraisal report
   * @param reportText - Text of the appraisal report
   * @param section - Specific section to check (optional)
   * @param provider - AI provider to use (optional)
   * @returns Compliance check results
   */
  async checkUSPAPCompliance(
    reportText: string,
    section?: string,
    provider: AIProvider = AIProvider.AUTO
  ): Promise<any> {
    console.log(`[AI Orchestrator] Checking USPAP compliance for report section: ${section || 'entire_report'}`);
    
    // If provider is AUTO, determine the best provider for the task
    const selectedProvider = this.selectBestProvider(
      OrchestrationTaskType.CHECK_COMPLIANCE,
      provider
    );
    
    console.log(`[AI Orchestrator] Using ${selectedProvider} for compliance check`);
    
    // Create a compliance check task
    const task: AgentTask<any> = {
      taskId: `compliance-task-${Date.now()}`,
      taskType: AgentTaskTypes.CHECK_USPAP_COMPLIANCE,
      priority: 1,
      data: {
        reportText,
        section: section || 'entire_report',
        severityThreshold: 'low'
      },
      requester: 'system',
      metadata: {
        provider: selectedProvider
      }
    };
    
    // Execute the task using the agent coordinator
    const result = await this.coordinator.executeTask(task);
    
    if (result.status !== 'completed') {
      throw new Error(`Failed to check compliance: ${result.error}`);
    }
    
    return result.result;
  }
  
  /**
   * Analyze comparable properties in relation to a subject property
   * @param subjectProperty - Subject property data
   * @param comparableProperties - Comparable properties data
   * @param provider - AI provider to use (optional)
   * @returns Comparable analysis results
   */
  async analyzeComparables(
    subjectProperty: any,
    comparableProperties: any[],
    provider: AIProvider = AIProvider.AUTO
  ): Promise<any> {
    console.log(`[AI Orchestrator] Analyzing ${comparableProperties.length} comparables`);
    
    // If provider is AUTO, determine the best provider for the task
    const selectedProvider = this.selectBestProvider(
      OrchestrationTaskType.COMPARABLE_SELECTION,
      provider
    );
    
    console.log(`[AI Orchestrator] Using ${selectedProvider} for comparable analysis`);
    
    // Create a comparable analysis task
    const task: AgentTask<any> = {
      taskId: `comps-task-${Date.now()}`,
      taskType: AgentTaskTypes.ANALYZE_COMPARABLES,
      priority: 1,
      data: {
        subjectProperty,
        comparableProperties
      },
      requester: 'system',
      metadata: {
        provider: selectedProvider
      }
    };
    
    // Execute the task using the agent coordinator
    const result = await this.coordinator.executeTask(task);
    
    if (result.status !== 'completed') {
      throw new Error(`Failed to analyze comparables: ${result.error}`);
    }
    
    return result.result;
  }
  
  /**
   * Select the best AI provider for a specific task
   * @param taskType - Type of orchestration task
   * @param requestedProvider - Specifically requested provider (optional)
   * @returns Selected AI provider
   */
  private selectBestProvider(
    taskType: OrchestrationTaskType,
    requestedProvider: AIProvider = AIProvider.AUTO
  ): AIProvider {
    // If a specific provider is requested, use that
    if (requestedProvider !== AIProvider.AUTO) {
      return requestedProvider;
    }
    
    // Otherwise, select the best provider based on the task type
    switch (taskType) {
      case OrchestrationTaskType.PROCESS_EMAIL_ORDER:
      case OrchestrationTaskType.PROCESS_DOCUMENT:
        // Anthropic is better at document understanding
        return AIProvider.ANTHROPIC;
        
      case OrchestrationTaskType.AUTOMATED_VALUATION:
      case OrchestrationTaskType.ADJUSTMENT_CALCULATION:
      case OrchestrationTaskType.GENERATE_ADJUSTMENT_MODEL:
        // OpenAI is better at numerical analysis
        return AIProvider.OPENAI;
        
      case OrchestrationTaskType.MARKET_ANALYSIS:
      case OrchestrationTaskType.GENERATE_REPORT_SECTION:
        // Anthropic is better at narrative generation
        return AIProvider.ANTHROPIC;
        
      case OrchestrationTaskType.CHECK_COMPLIANCE:
      case OrchestrationTaskType.VALIDATE_APPRAISAL:
        // Anthropic is better at detailed analysis
        return AIProvider.ANTHROPIC;
        
      case OrchestrationTaskType.COMPARABLE_SELECTION:
        // OpenAI is better at selection tasks
        return AIProvider.OPENAI;
        
      default:
        // Default to OpenAI
        return AIProvider.OPENAI;
    }
  }
}

// Create singleton instance
export const aiOrchestrator = new AIOrchestrator();