import { BaseAgent } from './base-agent';
import { AgentTask, AgentTaskTypes } from './types';
import { generatePropertyDescription } from '../anthropic';
import { PropertyExtraction } from '../anthropic';
import { z } from 'zod';

// Schema for narrative generation task data
const NarrativeGenerationTaskSchema = z.object({
  section: z.enum([
    'neighborhood', 
    'improvements', 
    'site', 
    'market_conditions', 
    'approach_to_value', 
    'reconciliation'
  ]),
  propertyData: z.object({
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
  additionalContext: z.string().optional(),
  length: z.enum(['brief', 'standard', 'detailed']).optional()
});

type NarrativeGenerationTask = z.infer<typeof NarrativeGenerationTaskSchema>;

// Schema for property description task data
const PropertyDescriptionTaskSchema = z.object({
  propertyData: z.object({
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
  additionalDetails: z.string().optional(),
  style: z.enum(['brief', 'standard', 'detailed']).optional()
});

type PropertyDescriptionTask = z.infer<typeof PropertyDescriptionTaskSchema>;

/**
 * Narrative Generation Agent
 * 
 * Specialized agent for generating narrative text for various sections
 * of an appraisal report.
 */
export class NarrativeAgent extends BaseAgent {
  /**
   * Create a new NarrativeAgent
   */
  constructor() {
    super(
      'narrative-agent',
      'Narrative Generation Agent',
      'Generates narrative text for appraisal reports',
      [
        AgentTaskTypes.GENERATE_NARRATIVE,
        AgentTaskTypes.GENERATE_PROPERTY_DESCRIPTION
      ]
    );
  }
  
  /**
   * Handle a task based on its type
   * @param task - Task to handle
   * @returns Generated narrative text
   */
  protected async handleTask<T, R>(task: AgentTask<T>): Promise<R> {
    switch (task.taskType) {
      case AgentTaskTypes.GENERATE_NARRATIVE:
        return this.generateNarrative(task as AgentTask<NarrativeGenerationTask>) as unknown as R;
        
      case AgentTaskTypes.GENERATE_PROPERTY_DESCRIPTION:
        return this.generatePropertyDescription(task as AgentTask<PropertyDescriptionTask>) as unknown as R;
        
      default:
        throw new Error(`Unsupported task type: ${task.taskType}`);
    }
  }
  
  /**
   * Generate narrative text for a specific section of an appraisal report
   * @param task - Narrative generation task
   * @returns Generated narrative text
   */
  private async generateNarrative(task: AgentTask<NarrativeGenerationTask>): Promise<{
    narrative: string;
    wordCount: number;
    section: string;
  }> {
    console.log(`[${this.name}] Generating ${task.data.section} narrative`);
    
    try {
      // Validate the task data
      const taskData = NarrativeGenerationTaskSchema.parse(task.data);
      
      // Generate narrative based on section type
      let narrative = '';
      
      switch (taskData.section) {
        case 'neighborhood':
          narrative = await this.generateNeighborhoodNarrative(taskData);
          break;
        case 'improvements':
          narrative = await this.generateImprovementsNarrative(taskData);
          break;
        case 'site':
          narrative = await this.generateSiteNarrative(taskData);
          break;
        case 'market_conditions':
          narrative = await this.generateMarketConditionsNarrative(taskData);
          break;
        case 'approach_to_value':
          narrative = await this.generateApproachToValueNarrative(taskData);
          break;
        case 'reconciliation':
          narrative = await this.generateReconciliationNarrative(taskData);
          break;
      }
      
      // Calculate word count
      const wordCount = narrative.split(/\s+/).filter(Boolean).length;
      
      return {
        narrative,
        wordCount,
        section: taskData.section
      };
    } catch (error) {
      console.error(`[${this.name}] Error generating narrative: ${error}`);
      throw error;
    }
  }
  
  /**
   * Generate a property description
   * @param task - Property description task
   * @returns Generated property description
   */
  private async generatePropertyDescription(task: AgentTask<PropertyDescriptionTask>): Promise<{
    description: string;
    wordCount: number;
  }> {
    console.log(`[${this.name}] Generating property description for ${task.data.propertyData.address}`);
    
    try {
      // Validate the task data
      const taskData = PropertyDescriptionTaskSchema.parse(task.data);
      
      // Use the Anthropic service to generate a property description
      const description = await generatePropertyDescription(
        taskData.propertyData,
        taskData.additionalDetails
      );
      
      // Calculate word count
      const wordCount = description.split(/\s+/).filter(Boolean).length;
      
      return {
        description,
        wordCount
      };
    } catch (error) {
      console.error(`[${this.name}] Error generating property description: ${error}`);
      throw error;
    }
  }
  
  /**
   * Generate neighborhood narrative
   * @param taskData - Task data
   * @returns Generated neighborhood narrative
   */
  private async generateNeighborhoodNarrative(taskData: NarrativeGenerationTask): Promise<string> {
    const property = taskData.propertyData;
    const city = property.city;
    const state = property.state;
    
    // This would ideally call an LLM with specific prompt engineering
    // For now, we'll use a template-based approach
    return `The subject property is located in ${city}, ${state}. The neighborhood is primarily residential, with a mix of single-family homes and some multi-family dwellings. The area has good access to local amenities including schools, shopping centers, and public transportation. 

The neighborhood appears to be well-maintained with stable property values. Properties in this area typically range from entry-level to mid-level homes, with some premium properties in select locations. The immediate vicinity has adequate infrastructure including paved roads, sidewalks, and street lighting.

Local employment centers are within reasonable commuting distance. The neighborhood benefits from proximity to parks and recreational facilities, contributing to its appeal for families. Overall, the location offers a balanced combination of convenience, accessibility, and residential appeal.`;
  }
  
  /**
   * Generate improvements narrative
   * @param taskData - Task data
   * @returns Generated improvements narrative
   */
  private async generateImprovementsNarrative(taskData: NarrativeGenerationTask): Promise<string> {
    const property = taskData.propertyData;
    const bedrooms = property.bedrooms || 'multiple';
    const bathrooms = property.bathrooms || 'multiple';
    const sqft = property.squareFeet ? `approximately ${property.squareFeet}` : 'adequate';
    const yearBuilt = property.yearBuilt || 'recent';
    
    return `The subject property is a ${property.propertyType} with ${bedrooms} bedrooms and ${bathrooms} bathrooms. The dwelling offers ${sqft} square feet of living space. Built in ${yearBuilt}, the home demonstrates ${yearBuilt > 2000 ? 'modern' : 'traditional'} construction methods and materials.

The property includes ${property.garage || 'parking provisions'} and ${property.basement ? `a ${property.basement} basement` : 'a standard foundation'}. Interior finishes appear to be of ${yearBuilt > 2010 ? 'contemporary' : 'conventional'} quality, with functional room layouts and adequate storage space.

Overall, the improvements contribute appropriately to the property's value and are consistent with neighborhood standards. The home's features and condition position it competitively within the local market for similar properties.`;
  }
  
  /**
   * Generate site narrative
   * @param taskData - Task data
   * @returns Generated site narrative
   */
  private async generateSiteNarrative(taskData: NarrativeGenerationTask): Promise<string> {
    const property = taskData.propertyData;
    
    return `The subject site is located at ${property.address}, ${property.city}, ${property.state} ${property.zipCode}. The lot ${property.lotSize ? `measures approximately ${property.lotSize}` : 'is typical for the neighborhood'} and has a generally level topography with adequate drainage.

The site offers good utility with standard access to public roads. All necessary utilities are available including water, electricity, gas, and sewage. There are no apparent adverse easements or encroachments that would negatively impact the property value.

The property's zoning appears consistent with its current use as a ${property.propertyType}. The surrounding land uses are compatible with the subject property, and there are no obvious external factors that would significantly detract from the site's value.`;
  }
  
  /**
   * Generate market conditions narrative
   * @param taskData - Task data
   * @returns Generated market conditions narrative
   */
  private async generateMarketConditionsNarrative(taskData: NarrativeGenerationTask): Promise<string> {
    const property = taskData.propertyData;
    
    return `The real estate market in ${property.city}, ${property.state} for ${property.propertyType} properties has demonstrated stability over the past 12 months with modest price appreciation. Current supply and demand factors indicate a balanced market with property inventory averaging approximately 3-4 months of supply.

Local economic conditions remain favorable with steady employment rates and moderate income growth supporting housing demand. Interest rates have remained within a competitive range, continuing to facilitate property financing for qualified buyers.

Properties in the subject's market area typically spend 30-45 days on market before selling, which indicates healthy buyer activity. New construction in the area has been moderate, maintaining a reasonable balance with existing housing stock. Overall, the current market conditions support stable property values with continued modest appreciation likely in the near term.`;
  }
  
  /**
   * Generate approach to value narrative
   * @param taskData - Task data
   * @returns Generated approach to value narrative
   */
  private async generateApproachToValueNarrative(taskData: NarrativeGenerationTask): Promise<string> {
    return `In developing the opinion of value for the subject property, three approaches to value were considered: the Sales Comparison Approach, the Cost Approach, and the Income Approach.

The Sales Comparison Approach was given primary consideration in this analysis as it most directly reflects the actions of buyers and sellers in the market. Five comparable sales from the subject's market area were analyzed, with adjustments made for relevant differences in location, physical characteristics, and market conditions at the time of sale. This approach provided the most reliable indication of value for this property type.

The Cost Approach was developed as a secondary method. It involved estimating the replacement cost of the improvements, less depreciation, plus the site value. While useful as a supporting analysis, this approach was given less weight due to the age of the improvements and the difficulty in accurately quantifying depreciation.

The Income Approach was considered but not developed in depth as the subject property type is predominantly owner-occupied in this market, with limited rental data available for reliable income analysis.

After careful consideration of all approaches, greatest weight was placed on the Sales Comparison Approach in arriving at the final opinion of value.`;
  }
  
  /**
   * Generate reconciliation narrative
   * @param taskData - Task data
   * @returns Generated reconciliation narrative
   */
  private async generateReconciliationNarrative(taskData: NarrativeGenerationTask): Promise<string> {
    return `The appraisal of the subject property involved a comprehensive analysis of relevant market data and property characteristics. All applicable approaches to value were considered, with primary emphasis placed on the Sales Comparison Approach as it most directly reflects current market behavior for this property type.

The comparable sales utilized in this analysis represent properties with similar utility, appeal, and characteristics to the subject. Appropriate adjustments were applied to account for material differences between the subject and comparable properties. The adjusted sale prices established a well-supported range of value.

The final opinion of value reconciles the various indications into a single point value that best represents the subject property's market value as of the effective date of this appraisal. The concluded value is consistent with market trends and supported by the available data.

This appraisal report has been prepared in compliance with the Uniform Standards of Professional Appraisal Practice (USPAP) and meets the requirements of the intended use and intended users identified in the report.`;
  }
}