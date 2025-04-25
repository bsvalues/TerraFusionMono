import { BaseAgent } from './base-agent';
import { AgentTask, AgentTaskTypes } from './types';
import { PropertyExtraction } from '../anthropic';
import { analyzeComparables } from '../anthropic';
import { z } from 'zod';

// Schema for property valuation task data
const PropertyValuationTaskSchema = z.object({
  property: z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    propertyType: z.string(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    squareFeet: z.number().optional(),
    yearBuilt: z.number().optional(),
    lotSize: z.string().optional(),
    stories: z.number().optional(),
    garage: z.string().optional(),
    basement: z.string().optional()
  }),
  approachType: z.enum(['sales_comparison', 'cost', 'income', 'all']).optional(),
  includeAdjustments: z.boolean().optional(),
  includeRationale: z.boolean().optional()
});

type PropertyValuationTask = z.infer<typeof PropertyValuationTaskSchema>;

// Schema for comparable analysis task data
const ComparableAnalysisTaskSchema = z.object({
  subjectProperty: z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    propertyType: z.string(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    squareFeet: z.number().optional(),
    yearBuilt: z.number().optional(),
    lotSize: z.string().optional(),
    stories: z.number().optional(),
    garage: z.string().optional(),
    basement: z.string().optional()
  }),
  comparableProperties: z.array(z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    propertyType: z.string(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    squareFeet: z.number().optional(),
    yearBuilt: z.number().optional(),
    lotSize: z.string().optional(),
    stories: z.number().optional(),
    garage: z.string().optional(),
    basement: z.string().optional(),
    salePrice: z.number().optional(),
    saleDate: z.string().optional()
  }))
});

type ComparableAnalysisTask = z.infer<typeof ComparableAnalysisTaskSchema>;

// Schema for adjustment recommendation task data
const AdjustmentRecommendationTaskSchema = z.object({
  subjectProperty: z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    propertyType: z.string(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    squareFeet: z.number().optional(),
    yearBuilt: z.number().optional(),
    lotSize: z.string().optional(),
    stories: z.number().optional(),
    garage: z.string().optional(),
    basement: z.string().optional()
  }),
  comparableProperty: z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    propertyType: z.string(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    squareFeet: z.number().optional(),
    yearBuilt: z.number().optional(),
    lotSize: z.string().optional(),
    stories: z.number().optional(),
    garage: z.string().optional(),
    basement: z.string().optional(),
    salePrice: z.number().optional(),
    saleDate: z.string().optional()
  }),
  marketFactors: z.object({
    pricePerSquareFoot: z.number().optional(),
    timeAdjustmentRate: z.number().optional(),
    locationFactor: z.number().optional()
  }).optional()
});

type AdjustmentRecommendationTask = z.infer<typeof AdjustmentRecommendationTaskSchema>;

/**
 * Valuation Agent
 * 
 * Specialized agent for estimating property values using various
 * approaches and analyzing comparable properties.
 */
export class ValuationAgent extends BaseAgent {
  /**
   * Create a new ValuationAgent
   */
  constructor() {
    super(
      'valuation-agent',
      'Valuation Agent',
      'Estimates property values and analyzes comparable properties',
      [
        AgentTaskTypes.ESTIMATE_PROPERTY_VALUE,
        AgentTaskTypes.ANALYZE_COMPARABLES,
        AgentTaskTypes.RECOMMEND_ADJUSTMENTS
      ]
    );
  }
  
  /**
   * Handle a task based on its type
   * @param task - Task to handle
   * @returns Valuation data
   */
  protected async handleTask<T, R>(task: AgentTask<T>): Promise<R> {
    switch (task.taskType) {
      case AgentTaskTypes.ESTIMATE_PROPERTY_VALUE:
        return this.estimatePropertyValue(task as AgentTask<PropertyValuationTask>) as unknown as R;
        
      case AgentTaskTypes.ANALYZE_COMPARABLES:
        return this.analyzeComparables(task as AgentTask<ComparableAnalysisTask>) as unknown as R;
        
      case AgentTaskTypes.RECOMMEND_ADJUSTMENTS:
        return this.recommendAdjustments(task as AgentTask<AdjustmentRecommendationTask>) as unknown as R;
        
      default:
        throw new Error(`Unsupported task type: ${task.taskType}`);
    }
  }
  
  /**
   * Estimate property value
   * @param task - Property valuation task
   * @returns Estimated property value and supporting data
   */
  private async estimatePropertyValue(task: AgentTask<PropertyValuationTask>): Promise<{
    estimatedValue: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    valueRange: {
      min: number;
      max: number;
    };
    approachResults?: {
      salesComparison?: number;
      cost?: number;
      income?: number;
    };
    reconciliation?: string;
  }> {
    console.log(`[${this.name}] Estimating value for property at ${task.data.property.address}`);
    
    try {
      // Validate the task data
      const taskData = PropertyValuationTaskSchema.parse(task.data);
      
      // This is a simplified implementation
      // In a real system, this would use more sophisticated ML models and market data
      
      // Calculate a basic estimated value based on property attributes
      // For this demo, we'll use a simplified formula
      const baseValue = 200000; // Base value for a standard property
      
      // Adjust based on bedrooms
      const bedroomAdjustment = ((taskData.property.bedrooms || 3) - 3) * 25000;
      
      // Adjust based on bathrooms
      const bathroomAdjustment = ((taskData.property.bathrooms || 2) - 2) * 15000;
      
      // Adjust based on square footage
      const sqftAdjustment = ((taskData.property.squareFeet || 1800) - 1800) * 100;
      
      // Adjust based on age
      const yearBuiltAdjustment = ((taskData.property.yearBuilt || 1990) - 1990) * 500;
      
      // Calculate estimated value
      const estimatedValue = Math.round(baseValue + bedroomAdjustment + bathroomAdjustment + sqftAdjustment + yearBuiltAdjustment);
      
      // Set confidence level based on available data
      const dataCompleteness = [
        taskData.property.bedrooms,
        taskData.property.bathrooms,
        taskData.property.squareFeet,
        taskData.property.yearBuilt,
        taskData.property.lotSize
      ].filter(Boolean).length / 5;
      
      let confidenceLevel: 'high' | 'medium' | 'low';
      if (dataCompleteness > 0.8) {
        confidenceLevel = 'high';
      } else if (dataCompleteness > 0.5) {
        confidenceLevel = 'medium';
      } else {
        confidenceLevel = 'low';
      }
      
      // Calculate value range based on confidence level
      const valueRangePercent = confidenceLevel === 'high' ? 0.05 : (confidenceLevel === 'medium' ? 0.1 : 0.2);
      const valueRange = {
        min: Math.round(estimatedValue * (1 - valueRangePercent)),
        max: Math.round(estimatedValue * (1 + valueRangePercent))
      };
      
      // Include multiple approaches if requested
      let approachResults = undefined;
      if (taskData.approachType === 'all') {
        approachResults = {
          salesComparison: estimatedValue,
          cost: Math.round(estimatedValue * 0.95),
          income: Math.round(estimatedValue * 1.05)
        };
      }
      
      return {
        estimatedValue,
        confidenceLevel,
        valueRange,
        approachResults,
        reconciliation: approachResults ? 'The sales comparison approach was given the most weight as it best reflects current market conditions.' : undefined
      };
    } catch (error) {
      console.error(`[${this.name}] Error estimating property value: ${error}`);
      throw error;
    }
  }
  
  /**
   * Analyze comparable properties
   * @param task - Comparable analysis task
   * @returns Analysis of comparable properties
   */
  private async analyzeComparables(task: AgentTask<ComparableAnalysisTask>): Promise<{
    analysis: string;
    comparisons: Array<{
      address: string;
      similarities: string[];
      differences: string[];
      overallComparability: 'excellent' | 'good' | 'fair' | 'poor';
    }>;
  }> {
    console.log(`[${this.name}] Analyzing comparables for property at ${task.data.subjectProperty.address}`);
    
    try {
      // Validate the task data
      const taskData = ComparableAnalysisTaskSchema.parse(task.data);
      
      // Use Anthropic to get a detailed analysis
      const analysisText = await analyzeComparables(
        taskData.subjectProperty,
        taskData.comparableProperties
      );
      
      // Create structured comparisons for each comparable
      const comparisons = taskData.comparableProperties.map(comp => {
        // Identify similarities
        const similarities = [];
        if (comp.bedrooms === taskData.subjectProperty.bedrooms) {
          similarities.push('Same number of bedrooms');
        }
        if (comp.bathrooms === taskData.subjectProperty.bathrooms) {
          similarities.push('Same number of bathrooms');
        }
        if (Math.abs((comp.squareFeet || 0) - (taskData.subjectProperty.squareFeet || 0)) < 200) {
          similarities.push('Similar square footage');
        }
        if (Math.abs((comp.yearBuilt || 0) - (taskData.subjectProperty.yearBuilt || 0)) < 5) {
          similarities.push('Similar age');
        }
        if (comp.propertyType === taskData.subjectProperty.propertyType) {
          similarities.push('Same property type');
        }
        
        // Identify differences
        const differences = [];
        if (comp.bedrooms !== taskData.subjectProperty.bedrooms) {
          differences.push(`Different number of bedrooms (${comp.bedrooms} vs ${taskData.subjectProperty.bedrooms})`);
        }
        if (comp.bathrooms !== taskData.subjectProperty.bathrooms) {
          differences.push(`Different number of bathrooms (${comp.bathrooms} vs ${taskData.subjectProperty.bathrooms})`);
        }
        if (Math.abs((comp.squareFeet || 0) - (taskData.subjectProperty.squareFeet || 0)) >= 200) {
          differences.push(`Different square footage (${comp.squareFeet} vs ${taskData.subjectProperty.squareFeet})`);
        }
        if (Math.abs((comp.yearBuilt || 0) - (taskData.subjectProperty.yearBuilt || 0)) >= 5) {
          differences.push(`Different age (${comp.yearBuilt} vs ${taskData.subjectProperty.yearBuilt})`);
        }
        if (comp.propertyType !== taskData.subjectProperty.propertyType) {
          differences.push(`Different property type (${comp.propertyType} vs ${taskData.subjectProperty.propertyType})`);
        }
        
        // Determine overall comparability
        const similarityScore = similarities.length / (similarities.length + differences.length);
        let overallComparability: 'excellent' | 'good' | 'fair' | 'poor';
        if (similarityScore > 0.8) {
          overallComparability = 'excellent';
        } else if (similarityScore > 0.6) {
          overallComparability = 'good';
        } else if (similarityScore > 0.4) {
          overallComparability = 'fair';
        } else {
          overallComparability = 'poor';
        }
        
        return {
          address: comp.address,
          similarities,
          differences,
          overallComparability
        };
      });
      
      return {
        analysis: analysisText,
        comparisons
      };
    } catch (error) {
      console.error(`[${this.name}] Error analyzing comparables: ${error}`);
      throw error;
    }
  }
  
  /**
   * Recommend adjustments for a comparable property
   * @param task - Adjustment recommendation task
   * @returns Recommended adjustments
   */
  private async recommendAdjustments(task: AgentTask<AdjustmentRecommendationTask>): Promise<{
    adjustments: Array<{
      feature: string;
      amount: number;
      direction: 'up' | 'down';
      reasoning: string;
    }>;
    totalAdjustment: number;
    adjustedValue: number;
  }> {
    console.log(`[${this.name}] Recommending adjustments for comparable at ${task.data.comparableProperty.address}`);
    
    try {
      // Validate the task data
      const taskData = AdjustmentRecommendationTaskSchema.parse(task.data);
      
      const subj = taskData.subjectProperty;
      const comp = taskData.comparableProperty;
      
      // Create adjustment recommendations
      const adjustments = [];
      let totalAdjustment = 0;
      
      // Bedrooms adjustment
      if (subj.bedrooms !== comp.bedrooms) {
        const bedroomValue = 25000;
        const difference = (subj.bedrooms || 0) - (comp.bedrooms || 0);
        const amount = Math.abs(difference * bedroomValue);
        const direction = difference > 0 ? 'up' : 'down';
        
        adjustments.push({
          feature: 'Bedrooms',
          amount,
          direction,
          reasoning: `Subject has ${subj.bedrooms} bedrooms, comparable has ${comp.bedrooms}. Adjust ${direction} by $${amount}.`
        });
        
        totalAdjustment += direction === 'up' ? amount : -amount;
      }
      
      // Bathrooms adjustment
      if (subj.bathrooms !== comp.bathrooms) {
        const bathroomValue = 15000;
        const difference = (subj.bathrooms || 0) - (comp.bathrooms || 0);
        const amount = Math.abs(difference * bathroomValue);
        const direction = difference > 0 ? 'up' : 'down';
        
        adjustments.push({
          feature: 'Bathrooms',
          amount,
          direction,
          reasoning: `Subject has ${subj.bathrooms} bathrooms, comparable has ${comp.bathrooms}. Adjust ${direction} by $${amount}.`
        });
        
        totalAdjustment += direction === 'up' ? amount : -amount;
      }
      
      // Square footage adjustment
      if (subj.squareFeet !== comp.squareFeet) {
        const sqftValue = 100; // Per square foot
        const difference = (subj.squareFeet || 0) - (comp.squareFeet || 0);
        const amount = Math.abs(difference * sqftValue);
        const direction = difference > 0 ? 'up' : 'down';
        
        adjustments.push({
          feature: 'Square Footage',
          amount,
          direction,
          reasoning: `Subject has ${subj.squareFeet} sqft, comparable has ${comp.squareFeet} sqft. Adjust ${direction} by $${amount}.`
        });
        
        totalAdjustment += direction === 'up' ? amount : -amount;
      }
      
      // Year built adjustment
      if (subj.yearBuilt !== comp.yearBuilt) {
        const yearValue = 500; // Per year
        const difference = (subj.yearBuilt || 0) - (comp.yearBuilt || 0);
        const amount = Math.abs(difference * yearValue);
        const direction = difference > 0 ? 'up' : 'down';
        
        adjustments.push({
          feature: 'Year Built',
          amount,
          direction,
          reasoning: `Subject built in ${subj.yearBuilt}, comparable built in ${comp.yearBuilt}. Adjust ${direction} by $${amount}.`
        });
        
        totalAdjustment += direction === 'up' ? amount : -amount;
      }
      
      // Garage adjustment
      if (subj.garage !== comp.garage) {
        const garageValue = 20000;
        // Simple check if one has a garage and the other doesn't
        const subjHasGarage = subj.garage && subj.garage.toLowerCase() !== 'none';
        const compHasGarage = comp.garage && comp.garage.toLowerCase() !== 'none';
        
        if (subjHasGarage && !compHasGarage) {
          adjustments.push({
            feature: 'Garage',
            amount: garageValue,
            direction: 'up',
            reasoning: `Subject has garage, comparable does not. Adjust up by $${garageValue}.`
          });
          
          totalAdjustment += garageValue;
        } else if (!subjHasGarage && compHasGarage) {
          adjustments.push({
            feature: 'Garage',
            amount: garageValue,
            direction: 'down',
            reasoning: `Subject does not have garage, comparable does. Adjust down by $${garageValue}.`
          });
          
          totalAdjustment -= garageValue;
        }
      }
      
      // Calculate adjusted value
      const salePrice = comp.salePrice || 0;
      const adjustedValue = salePrice + totalAdjustment;
      
      return {
        adjustments,
        totalAdjustment,
        adjustedValue
      };
    } catch (error) {
      console.error(`[${this.name}] Error recommending adjustments: ${error}`);
      throw error;
    }
  }
}