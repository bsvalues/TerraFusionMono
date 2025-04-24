import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { NutritionalDeficiencyType, RiskLevel } from '../models';

/**
 * Soil analysis result
 */
export interface SoilAnalysisResult {
  soilType: string;
  ph: number;
  organicMatter: number;
  nutrientLevels: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    calcium?: number;
    magnesium?: number;
    sulfur?: number;
    zinc?: number;
    iron?: number;
    manganese?: number;
    boron?: number;
  };
  waterRetention: 'poor' | 'moderate' | 'good' | 'excellent';
  deficiencies: Array<{
    nutrient: NutritionalDeficiencyType;
    severity: RiskLevel;
    recommendations: string[];
  }>;
  suitabilityScore: number; // 0-100
  cropSpecificRating: number; // 0-100
  recommendations: string[];
}

/**
 * Soil Health Trend
 */
export interface SoilHealthTrend {
  period: string;
  organicMatterChange: number;
  phChange: number;
  nutrientChanges: Record<string, number>;
  overallTrend: 'improving' | 'stable' | 'declining';
}

/**
 * Soil Analyzer
 * 
 * Specialized component for analyzing soil health and conditions
 */
export class SoilAnalyzer {
  private openai: OpenAI;
  
  constructor() {
    // Initialize OpenAI with API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required for soil analysis');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    logger.info('SoilAnalyzer initialized');
  }
  
  /**
   * Analyze soil data for a specific parcel and crop
   * @param parcelId The parcel ID
   * @param cropType The crop type
   * @returns Detailed soil analysis
   */
  async analyzeSoil(parcelId: number, cropType: string): Promise<SoilAnalysisResult> {
    logger.info(`Analyzing soil for parcel ${parcelId} with crop ${cropType}`);
    
    try {
      // Get soil data from measurements
      const soilData = await this.getSoilData(parcelId);
      
      // Analyze soil data using AI
      const analysis = await this.performAIAnalysis(soilData, cropType);
      
      logger.info(`Soil analysis completed for parcel ${parcelId}`);
      return analysis;
    } catch (error) {
      logger.error(`Error analyzing soil for parcel ${parcelId}`, error);
      throw new Error(`Soil analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Analyze soil health trends over time
   * @param parcelId The parcel ID
   * @param period The time period for analysis (e.g., '6months', '1year')
   * @returns Soil health trend analysis
   */
  async analyzeSoilTrend(parcelId: number, period: string): Promise<SoilHealthTrend> {
    logger.info(`Analyzing soil trend for parcel ${parcelId} over ${period}`);
    
    try {
      // Get historical soil measurements
      const soilHistory = await this.getHistoricalSoilData(parcelId, period);
      
      // Analyze trends
      const trend: SoilHealthTrend = {
        period,
        organicMatterChange: this.calculateChange(soilHistory, 'organicMatter'),
        phChange: this.calculateChange(soilHistory, 'ph'),
        nutrientChanges: {
          nitrogen: this.calculateChange(soilHistory, 'nutrients.nitrogen'),
          phosphorus: this.calculateChange(soilHistory, 'nutrients.phosphorus'),
          potassium: this.calculateChange(soilHistory, 'nutrients.potassium'),
        },
        overallTrend: 'stable', // Default
      };
      
      // Determine overall trend
      const changes = [
        trend.organicMatterChange,
        ...Object.values(trend.nutrientChanges)
      ];
      
      const avgChange = changes.reduce((sum, val) => sum + val, 0) / changes.length;
      
      if (avgChange > 5) {
        trend.overallTrend = 'improving';
      } else if (avgChange < -5) {
        trend.overallTrend = 'declining';
      }
      
      logger.info(`Soil trend analysis completed for parcel ${parcelId}`);
      return trend;
    } catch (error) {
      logger.error(`Error analyzing soil trend for parcel ${parcelId}`, error);
      throw new Error(`Soil trend analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Provide soil amendment recommendations based on analysis
   * @param analysis The soil analysis result
   * @param cropType The crop type
   * @returns Recommended soil amendments
   */
  async recommendAmendments(analysis: SoilAnalysisResult, cropType: string): Promise<string[]> {
    logger.info(`Generating soil amendment recommendations for ${cropType}`);
    
    try {
      const prompt = `
      Based on the following soil analysis for ${cropType}, recommend specific soil amendments:
      
      SOIL ANALYSIS:
      ${JSON.stringify(analysis, null, 2)}
      
      Provide a list of specific amendments, application rates, and timing recommendations
      to optimize soil health for ${cropType} cultivation.
      `;
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an agricultural soil expert specializing in soil amendments and fertilization recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });
      
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from AI service');
      }
      
      // Parse recommendations from content
      // For simplicity, we'll just split by newlines and filter empty lines
      const recommendations = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      logger.info(`Generated ${recommendations.length} soil amendment recommendations`);
      return recommendations;
    } catch (error) {
      logger.error('Error generating soil amendment recommendations', error);
      throw new Error(`Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Private helper methods
  
  /**
   * Fetch soil data for a specific parcel
   */
  private async getSoilData(parcelId: number): Promise<any> {
    // In a real implementation, this would query the database for soil data
    // For now, return placeholder data
    return {
      type: 'loam',
      ph: 6.5,
      organicMatter: 3.2,
      nutrients: {
        nitrogen: 32, // ppm
        phosphorus: 45, // ppm
        potassium: 180, // ppm
        calcium: 1200, // ppm
        magnesium: 140, // ppm
        sulfur: 15, // ppm
      },
      cec: 12.5, // meq/100g
      basePercentages: {
        calcium: 68,
        magnesium: 12,
        potassium: 3.8,
        hydrogen: 16.2,
      },
      texture: {
        sand: 40,
        silt: 40,
        clay: 20,
      }
    };
  }
  
  /**
   * Fetch historical soil data for a parcel
   */
  private async getHistoricalSoilData(parcelId: number, period: string): Promise<any[]> {
    // In a real implementation, this would query the database for historical measurements
    // For now, return an empty array
    return [];
  }
  
  /**
   * Calculate change in a specific soil property over time
   */
  private calculateChange(history: any[], property: string): number {
    if (history.length < 2) {
      return 0;
    }
    
    // In a real implementation, this would perform actual calculations on historical data
    // For now, return a random number between -10 and 10 to simulate a change
    return Math.random() * 20 - 10;
  }
  
  /**
   * Perform AI analysis on soil data
   */
  private async performAIAnalysis(soilData: any, cropType: string): Promise<SoilAnalysisResult> {
    try {
      const prompt = `
      Analyze the following soil data for ${cropType} cultivation:
      
      SOIL DATA:
      ${JSON.stringify(soilData, null, 2)}
      
      Provide a comprehensive analysis including:
      1. Overall soil health assessment
      2. Suitability for ${cropType}
      3. Nutrient deficiencies or imbalances
      4. Recommendations for improvement
      
      Return your analysis in JSON format matching the SoilAnalysisResult type.
      `;
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an agricultural soil expert. Analyze soil data and provide detailed insights in JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from AI service');
      }
      
      // Parse the AI-generated analysis
      const analysis = JSON.parse(content) as SoilAnalysisResult;
      
      return analysis;
    } catch (error) {
      logger.error('Error performing AI analysis on soil data', error);
      throw error;
    }
  }
}