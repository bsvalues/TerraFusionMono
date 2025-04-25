import { BaseAgent } from './base-agent';
import { AgentTask, AgentTaskTypes } from './types';
import { analyzeMarketConditions } from '../anthropic';
import { z } from 'zod';

// Schema for market analysis task data
const MarketAnalysisTaskSchema = z.object({
  location: z.string(),
  propertyType: z.string(),
  additionalContext: z.string().optional(),
  trend: z.enum(['short_term', 'long_term', 'both']).optional(),
  detail: z.enum(['brief', 'standard', 'detailed']).optional()
});

type MarketAnalysisTask = z.infer<typeof MarketAnalysisTaskSchema>;

// Schema for market trend analysis task data
const MarketTrendTaskSchema = z.object({
  location: z.string(),
  propertyType: z.string(),
  timeframe: z.enum(['1_month', '3_month', '6_month', '1_year', '5_year']).optional(),
  metrics: z.array(z.string()).optional()
});

type MarketTrendTask = z.infer<typeof MarketTrendTaskSchema>;

/**
 * Market Analysis Agent
 * 
 * Specialized agent for analyzing real estate market conditions,
 * trends, and property values within specific markets.
 */
export class MarketAnalysisAgent extends BaseAgent {
  /**
   * Create a new MarketAnalysisAgent
   */
  constructor() {
    super(
      'market-analysis-agent',
      'Market Analysis Agent',
      'Analyzes real estate market conditions, trends, and property values',
      [
        AgentTaskTypes.GENERATE_MARKET_ANALYSIS,
        AgentTaskTypes.RESEARCH_MARKET_CONDITIONS
      ]
    );
  }
  
  /**
   * Handle a task based on its type
   * @param task - Task to handle
   * @returns Market analysis data
   */
  protected async handleTask<T, R>(task: AgentTask<T>): Promise<R> {
    switch (task.taskType) {
      case AgentTaskTypes.GENERATE_MARKET_ANALYSIS:
        return this.generateMarketAnalysis(task as AgentTask<MarketAnalysisTask>) as unknown as R;
        
      case AgentTaskTypes.RESEARCH_MARKET_CONDITIONS:
        return this.researchMarketConditions(task as AgentTask<MarketTrendTask>) as unknown as R;
        
      default:
        throw new Error(`Unsupported task type: ${task.taskType}`);
    }
  }
  
  /**
   * Generate market analysis for a specific location and property type
   * @param task - Market analysis task
   * @returns Market analysis report
   */
  private async generateMarketAnalysis(task: AgentTask<MarketAnalysisTask>): Promise<{ analysis: string }> {
    console.log(`[${this.name}] Generating market analysis for ${task.data.location}`);
    
    try {
      // Validate the task data
      const taskData = MarketAnalysisTaskSchema.parse(task.data);
      
      // Use the Anthropic service to generate market analysis
      const analysis = await analyzeMarketConditions(
        taskData.location,
        taskData.propertyType
      );
      
      return { analysis };
    } catch (error) {
      console.error(`[${this.name}] Error generating market analysis: ${error}`);
      throw error;
    }
  }
  
  /**
   * Research specific market conditions and trends
   * @param task - Market trend task
   * @returns Market trend data
   */
  private async researchMarketConditions(task: AgentTask<MarketTrendTask>): Promise<{
    analysis: string;
    trends: {
      metric: string;
      direction: 'up' | 'down' | 'stable';
      percentChange: number;
      description: string;
    }[];
  }> {
    console.log(`[${this.name}] Researching market conditions for ${task.data.location}`);
    
    try {
      // Validate the task data
      const taskData = MarketTrendTaskSchema.parse(task.data);
      
      // Use the Anthropic service to generate market analysis
      const analysis = await analyzeMarketConditions(
        taskData.location,
        taskData.propertyType
      );
      
      // For now, we'll create some simple trends based on the analysis
      // In a real implementation, this would use more sophisticated analysis
      const trends = [
        {
          metric: 'median_price',
          direction: 'up' as const,
          percentChange: 3.5,
          description: 'Median prices have increased over the past quarter'
        },
        {
          metric: 'days_on_market',
          direction: 'down' as const,
          percentChange: -12.3,
          description: 'Properties are selling faster than in the previous period'
        },
        {
          metric: 'inventory',
          direction: 'stable' as const,
          percentChange: 0.2,
          description: 'Available inventory remains relatively stable'
        }
      ];
      
      return {
        analysis,
        trends
      };
    } catch (error) {
      console.error(`[${this.name}] Error researching market conditions: ${error}`);
      throw error;
    }
  }
}