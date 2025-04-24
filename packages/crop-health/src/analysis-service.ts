import OpenAI from 'openai';
import { 
  CropHealthInsights, 
  CropHealthStatus, 
  HealthAnalysisRequest,
  QuickHealthCheckRequest,
  RiskLevel,
  GrowthStage
} from './models';
import { logger } from './utils/logger';

/**
 * CropHealthAnalysisService
 * Provides AI-powered analysis of crop health
 */
export class CropHealthAnalysisService {
  private openai: OpenAI;
  
  constructor() {
    // Initialize OpenAI with API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required for crop health analysis');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    logger.info('CropHealthAnalysisService initialized');
  }
  
  /**
   * Analyze crop health for a specific parcel
   * @param request The analysis request
   * @returns Comprehensive crop health insights
   */
  async analyzeParcelHealth(request: HealthAnalysisRequest): Promise<CropHealthInsights> {
    logger.info(`Analyzing health for parcel ${request.parcelId}`);
    
    try {
      // This would typically fetch parcel data from the database
      // For now, we'll retrieve data using the parcels API
      const parcelData = await this.getParcelData(request.parcelId);
      
      if (!parcelData) {
        throw new Error(`Parcel ${request.parcelId} not found`);
      }
      
      // Get relevant measurements
      const measurements = await this.getParcelMeasurements(request.parcelId);
      
      // Get weather data
      const weatherData = await this.getWeatherData(parcelData.coordinates);
      
      // Get soil data
      const soilData = await this.getSoilData(request.parcelId);
      
      // Use OpenAI to analyze the data and generate insights
      const analysisPrompt = this.buildAnalysisPrompt(
        parcelData, 
        measurements, 
        weatherData, 
        soilData,
        request.detailLevel
      );
      
      // Call OpenAI for analysis
      const aiResponse = await this.openai.chat.completions.create({
        model: "gpt-4o",  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an agricultural AI expert specializing in crop health analysis. You analyze data about agricultural parcels and provide detailed insights about crop health, risks, and growth predictions. Provide your analysis in JSON format."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        response_format: { type: "json_object" }
      });
      
      // Parse the AI response
      const aiContent = aiResponse.choices[0].message.content;
      if (!aiContent) {
        throw new Error('No response from AI service');
      }
      
      // Parse and validate the AI-generated insights
      const insights = JSON.parse(aiContent) as CropHealthInsights;
      
      // Augment and validate the insights
      const enhancedInsights = this.enhanceInsights(insights, request);
      
      // Log for tracking usage and results
      logger.info(`Health analysis completed for parcel ${request.parcelId}`, {
        healthScore: enhancedInsights.healthScore,
        status: enhancedInsights.overallHealth,
        confidence: enhancedInsights.confidenceLevel,
        riskCount: enhancedInsights.riskFactors.length
      });
      
      return enhancedInsights;
    } catch (error) {
      logger.error(`Error analyzing health for parcel ${request.parcelId}`, error);
      throw new Error(`Crop health analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Perform a quick health check based on minimal data
   * @param request Quick health check request with minimal data
   * @returns Basic health insights
   */
  async quickHealthCheck(request: QuickHealthCheckRequest): Promise<CropHealthInsights> {
    logger.info(`Quick health check for parcel ${request.parcelId}`);
    
    try {
      // For quick checks, we use a simpler prompt with the data provided
      const quickCheckPrompt = this.buildQuickCheckPrompt(request);
      
      // Call OpenAI for quick analysis
      const aiResponse = await this.openai.chat.completions.create({
        model: "gpt-4o",  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an agricultural AI expert. Provide a quick assessment of crop health based on limited data. Return your analysis in JSON format."
          },
          {
            role: "user",
            content: quickCheckPrompt
          }
        ],
        response_format: { type: "json_object" }
      });
      
      // Parse the AI response
      const aiContent = aiResponse.choices[0].message.content;
      if (!aiContent) {
        throw new Error('No response from AI service');
      }
      
      // Parse and validate the AI-generated insights
      const insights = JSON.parse(aiContent) as CropHealthInsights;
      
      // Set default values for quick check
      insights.parcelId = request.parcelId;
      insights.cropType = request.cropType;
      insights.analysisDate = new Date();
      
      // Log for tracking
      logger.info(`Quick health check completed for parcel ${request.parcelId}`, {
        healthScore: insights.healthScore,
        status: insights.overallHealth
      });
      
      return insights;
    } catch (error) {
      logger.error(`Error performing quick health check for parcel ${request.parcelId}`, error);
      throw new Error(`Quick health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Generate a seasonal forecast for a parcel
   * @param parcelId The parcel ID
   * @returns Seasonal forecast and long-term health prediction
   */
  async generateSeasonalForecast(parcelId: number): Promise<any> {
    // Implementation for seasonal forecasting
    // This would use historical data and AI models to predict long-term outcomes
    // For now, this is a placeholder
    return {
      parcelId,
      forecastDate: new Date(),
      seasonalPredictions: {
        // Placeholder data that would be filled by the actual implementation
      }
    };
  }
  
  /**
   * Retrieve detailed growing conditions based on the current crop and location
   * @param parcelId The parcel ID
   * @param cropType The crop type
   * @returns Optimal growing conditions and current status
   */
  async getOptimalGrowingConditions(parcelId: number, cropType: string): Promise<any> {
    // Implementation for retrieving optimal growing conditions
    // This would use a crop database and compare to current conditions
    // For now, this is a placeholder
    return {
      parcelId,
      cropType,
      optimalConditions: {
        // Placeholder data that would be filled by the actual implementation
      }
    };
  }
  
  // Private helper methods
  
  /**
   * Fetch parcel data from the database or API
   */
  private async getParcelData(parcelId: number): Promise<any> {
    try {
      // In a real implementation, this would make a database query
      // or API call to get the full parcel data
      
      // For now, return a placeholder structure that would have the correct shape
      return {
        id: parcelId,
        name: `Parcel ${parcelId}`,
        coordinates: { latitude: 0, longitude: 0 }, // Placeholder
        areaHectares: 10, // Placeholder
        currentCrop: 'corn', // Placeholder
        soilType: 'loam', // Placeholder
        plantingDate: new Date(new Date().setDate(new Date().getDate() - 30)), // 30 days ago
        irrigationType: 'drip',
        // Additional fields would be included
      };
    } catch (error) {
      logger.error(`Error fetching parcel data for ${parcelId}`, error);
      throw error;
    }
  }
  
  /**
   * Fetch parcel measurements from the database or API
   */
  private async getParcelMeasurements(parcelId: number): Promise<any[]> {
    try {
      // In a real implementation, this would query the database for measurements
      
      // For now, return an empty array
      return [];
    } catch (error) {
      logger.error(`Error fetching measurements for parcel ${parcelId}`, error);
      throw error;
    }
  }
  
  /**
   * Fetch weather data for the parcel's location
   */
  private async getWeatherData(coordinates: { latitude: number, longitude: number }): Promise<any> {
    try {
      // This would call a weather API in a real implementation
      
      // Return placeholder weather data
      return {
        current: {
          temperature: 22,
          humidity: 60,
          conditions: 'Clear'
        },
        forecast: [
          // Weather forecast would be here
        ],
        historical: [
          // Historical weather would be here
        ]
      };
    } catch (error) {
      logger.error(`Error fetching weather data`, error);
      throw error;
    }
  }
  
  /**
   * Fetch soil data for the parcel
   */
  private async getSoilData(parcelId: number): Promise<any> {
    try {
      // This would query soil records in a real implementation
      
      // Return placeholder soil data
      return {
        type: 'loam',
        ph: 6.5,
        organicMatter: 3.2,
        nutrients: {
          nitrogen: 'medium',
          phosphorus: 'high',
          potassium: 'medium'
        }
      };
    } catch (error) {
      logger.error(`Error fetching soil data for parcel ${parcelId}`, error);
      throw error;
    }
  }
  
  /**
   * Build the analysis prompt for the AI model
   */
  private buildAnalysisPrompt(
    parcelData: any,
    measurements: any[],
    weatherData: any,
    soilData: any,
    detailLevel: string
  ): string {
    // Construct a detailed prompt for the AI
    return `
    Analyze the following agricultural parcel data and provide detailed crop health insights:
    
    PARCEL INFORMATION:
    ${JSON.stringify(parcelData, null, 2)}
    
    RECENT MEASUREMENTS:
    ${JSON.stringify(measurements, null, 2)}
    
    WEATHER DATA:
    ${JSON.stringify(weatherData, null, 2)}
    
    SOIL DATA:
    ${JSON.stringify(soilData, null, 2)}
    
    Detail Level: ${detailLevel}
    
    Provide a comprehensive analysis with the following:
    1. Overall health score (0-100) and status (excellent, good, fair, poor, critical)
    2. Current growth stage and progress
    3. Risk factors (weather, pests, nutritional, etc.) with probability and impact
    4. Growth predictions including estimated harvest date and yield
    5. Recommended actions for optimal growth
    6. Visual indicators of current health status
    
    Return the analysis in JSON format matching the CropHealthInsights type.
    `;
  }
  
  /**
   * Build a quick check prompt for the AI model
   */
  private buildQuickCheckPrompt(request: QuickHealthCheckRequest): string {
    return `
    Perform a quick crop health assessment with the following limited data:
    
    PARCEL ID: ${request.parcelId}
    CROP TYPE: ${request.cropType}
    GROWTH STAGE: ${request.growthStage || 'Unknown'}
    
    SOIL CONDITIONS:
    ${request.soilConditions ? JSON.stringify(request.soilConditions, null, 2) : 'No data provided'}
    
    RECENT WEATHER:
    ${request.recentWeather ? JSON.stringify(request.recentWeather, null, 2) : 'No data provided'}
    
    CURRENT SYMPTOMS:
    ${request.currentSymptoms ? JSON.stringify(request.currentSymptoms, null, 2) : 'None reported'}
    
    Provide a basic health assessment with:
    1. Overall health status and score (0-100)
    2. Likely risks based on the limited information
    3. Basic recommendations
    
    Return the analysis in JSON format matching the CropHealthInsights type, with best estimates for missing information.
    `;
  }
  
  /**
   * Enhance and validate the AI-generated insights
   */
  private enhanceInsights(insights: CropHealthInsights, request: HealthAnalysisRequest): CropHealthInsights {
    // Add the parcel ID if not included
    insights.parcelId = request.parcelId;
    
    // Ensure the analysis date is set
    insights.analysisDate = new Date();
    
    // Ensure the confidence level is valid
    insights.confidenceLevel = Math.max(0, Math.min(1, insights.confidenceLevel));
    
    // Ensure the health score is valid
    insights.healthScore = Math.max(0, Math.min(100, insights.healthScore));
    
    // Add a default trend if missing
    if (!insights.historicalTrend) {
      insights.historicalTrend = {
        period: '30 days',
        trend: 'stable',
        details: 'Insufficient historical data for trend analysis'
      };
    }
    
    return insights;
  }
}