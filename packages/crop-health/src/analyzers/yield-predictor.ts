import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { GrowthStage } from '../models';

/**
 * Yield Prediction Result
 */
export interface YieldPredictionResult {
  predictedYield: {
    value: number;
    unit: string;
    perHectare: number;
  };
  confidenceInterval: {
    low: number;
    high: number;
  };
  confidenceLevel: number; // 0-1
  factors: Array<{
    name: string;
    impact: number; // -1 to 1, negative means reducing yield
    description: string;
  }>;
  comparisonToAverage: number; // percentage +/- compared to regional average
  harvestDateEstimate: Date;
  qualityPrediction: {
    overall: 'poor' | 'below_average' | 'average' | 'good' | 'excellent';
    size: 'small' | 'medium' | 'large';
    uniformity: number; // 0-1
    marketGrade: string;
  };
  marketValueEstimate: {
    perUnit: number;
    total: number;
    currency: string;
  };
}

/**
 * Scenario Analysis Result
 */
export interface ScenarioAnalysisResult {
  scenarios: Array<{
    name: string;
    description: string;
    yieldChange: number; // percentage
    probabilityOfOccurrence: number; // 0-1
    mitigationStrategy: string;
    predictedYield: number;
  }>;
  recommendedActions: string[];
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high';
    biggestThreat: string;
    biggestOpportunity: string;
  };
}

/**
 * Growth Stage Prediction
 */
export interface GrowthStagePrediction {
  currentStage: GrowthStage;
  daysInCurrentStage: number;
  percentageComplete: number; // 0-100
  daysToNextStage: number;
  nextStage: GrowthStage;
  totalGrowthProgress: number; // 0-100
  daysToHarvest: number;
  predictedHarvestDate: Date;
}

/**
 * Yield Predictor
 * 
 * Specialized component for predicting crop yields and growth stages
 */
export class YieldPredictor {
  private openai: OpenAI;
  
  constructor() {
    // Initialize OpenAI with API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required for yield prediction');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    logger.info('YieldPredictor initialized');
  }
  
  /**
   * Predict yield for a specific parcel
   * @param parcelId The parcel ID
   * @returns Detailed yield prediction
   */
  async predictYield(parcelId: number): Promise<YieldPredictionResult> {
    logger.info(`Predicting yield for parcel ${parcelId}`);
    
    try {
      // Get parcel data
      const parcelData = await this.getParcelData(parcelId);
      
      // Get measurements
      const measurements = await this.getParcelMeasurements(parcelId);
      
      // Get weather forecast
      const weatherForecast = await this.getWeatherForecast(parcelData.coordinates);
      
      // Get historical yield data
      const historicalYields = await this.getHistoricalYields(parcelData.currentCrop);
      
      // Perform AI analysis
      const prediction = await this.performYieldPrediction(
        parcelData,
        measurements,
        weatherForecast,
        historicalYields
      );
      
      logger.info(`Yield prediction completed for parcel ${parcelId}`);
      return prediction;
    } catch (error) {
      logger.error(`Error predicting yield for parcel ${parcelId}`, error);
      throw new Error(`Yield prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Predict growth stages and timeline
   * @param parcelId The parcel ID
   * @returns Growth stage predictions
   */
  async predictGrowthStages(parcelId: number): Promise<GrowthStagePrediction> {
    logger.info(`Predicting growth stages for parcel ${parcelId}`);
    
    try {
      // Get parcel data
      const parcelData = await this.getParcelData(parcelId);
      
      // Get measurements
      const measurements = await this.getParcelMeasurements(parcelId);
      
      // Get weather forecast
      const weatherForecast = await this.getWeatherForecast(parcelData.coordinates);
      
      // Calculate days since planting
      const daysSincePlanting = parcelData.plantingDate 
        ? Math.floor((new Date().getTime() - new Date(parcelData.plantingDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      // Query AI for growth stage prediction
      const prompt = `
      Predict the growth stages for the following crop:
      
      CROP TYPE: ${parcelData.currentCrop}
      DAYS SINCE PLANTING: ${daysSincePlanting}
      PLANTING DATE: ${parcelData.plantingDate}
      
      RECENT MEASUREMENTS:
      ${JSON.stringify(measurements, null, 2)}
      
      WEATHER FORECAST:
      ${JSON.stringify(weatherForecast, null, 2)}
      
      Provide a detailed growth stage prediction including:
      1. Current growth stage
      2. Days in current stage and percentage complete
      3. Days to next stage
      4. Total growth progress
      5. Days to harvest and predicted harvest date
      
      Return your prediction in JSON format matching the GrowthStagePrediction type.
      `;
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an agricultural growth expert. Predict crop growth stages and timeline in JSON format."
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
      
      // Parse the AI-generated prediction
      const prediction = JSON.parse(content) as GrowthStagePrediction;
      
      logger.info(`Growth stage prediction completed for parcel ${parcelId}`);
      return prediction;
    } catch (error) {
      logger.error(`Error predicting growth stages for parcel ${parcelId}`, error);
      throw new Error(`Growth stage prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Analyze different scenarios and their impact on yield
   * @param parcelId The parcel ID
   * @returns Scenario analysis results
   */
  async analyzeScenarios(parcelId: number): Promise<ScenarioAnalysisResult> {
    logger.info(`Analyzing yield scenarios for parcel ${parcelId}`);
    
    try {
      // Get parcel data
      const parcelData = await this.getParcelData(parcelId);
      
      // Get base yield prediction
      const baseYield = await this.predictYield(parcelId);
      
      // Define scenarios to analyze
      const scenarios = [
        "Optimal conditions (ideal weather, no pests)",
        "Drought conditions (30% less rainfall than expected)",
        "Excess rainfall (30% more rainfall than expected)",
        "Pest infestation (moderate level)",
        "Disease outbreak (specific to the crop type)",
        "Early frost event",
        "Heat wave during critical growth period"
      ];
      
      // Query AI for scenario analysis
      const prompt = `
      Analyze the following scenarios and their impact on crop yield:
      
      CROP TYPE: ${parcelData.currentCrop}
      BASE YIELD PREDICTION: ${JSON.stringify(baseYield, null, 2)}
      
      SCENARIOS TO ANALYZE:
      ${scenarios.join('\n')}
      
      For each scenario, provide:
      1. Expected yield change (percentage)
      2. Probability of occurrence
      3. Mitigation strategies
      4. Predicted yield
      
      Also provide an overall risk assessment and recommended actions.
      
      Return your analysis in JSON format matching the ScenarioAnalysisResult type.
      `;
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an agricultural risk analyst. Analyze different scenarios and their impact on crop yield in JSON format."
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
      const analysis = JSON.parse(content) as ScenarioAnalysisResult;
      
      logger.info(`Scenario analysis completed for parcel ${parcelId}`);
      return analysis;
    } catch (error) {
      logger.error(`Error analyzing scenarios for parcel ${parcelId}`, error);
      throw new Error(`Scenario analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Private helper methods
  
  /**
   * Fetch parcel data
   */
  private async getParcelData(parcelId: number): Promise<any> {
    // In a real implementation, this would query the database
    // For now, return placeholder data
    return {
      id: parcelId,
      name: `Parcel ${parcelId}`,
      coordinates: { latitude: 0, longitude: 0 },
      areaHectares: 10,
      currentCrop: 'corn',
      soilType: 'loam',
      plantingDate: new Date(new Date().setDate(new Date().getDate() - 45)),
      irrigationType: 'drip',
    };
  }
  
  /**
   * Fetch parcel measurements
   */
  private async getParcelMeasurements(parcelId: number): Promise<any[]> {
    // In a real implementation, this would query the database
    // For now, return an empty array
    return [];
  }
  
  /**
   * Fetch weather forecast
   */
  private async getWeatherForecast(coordinates: { latitude: number, longitude: number }): Promise<any> {
    // In a real implementation, this would call a weather API
    // For now, return placeholder data
    return {
      daily: [
        {
          date: new Date().toISOString(),
          tempMax: 25,
          tempMin: 15,
          precipitation: 0,
          conditions: 'Clear'
        },
        {
          date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
          tempMax: 26,
          tempMin: 16,
          precipitation: 0,
          conditions: 'Clear'
        },
        {
          date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
          tempMax: 24,
          tempMin: 14,
          precipitation: 5,
          conditions: 'Partly Cloudy'
        },
        {
          date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
          tempMax: 22,
          tempMin: 13,
          precipitation: 10,
          conditions: 'Light Rain'
        },
        {
          date: new Date(new Date().setDate(new Date().getDate() + 4)).toISOString(),
          tempMax: 23,
          tempMin: 14,
          precipitation: 2,
          conditions: 'Partly Cloudy'
        }
      ]
    };
  }
  
  /**
   * Fetch historical yield data
   */
  private async getHistoricalYields(cropType: string): Promise<any[]> {
    // In a real implementation, this would query historical data
    // For now, return placeholder data
    return [
      {
        year: new Date().getFullYear() - 1,
        yield: 8.5, // metric tons per hectare
        conditions: 'Good growing season, adequate rainfall'
      },
      {
        year: new Date().getFullYear() - 2,
        yield: 7.9,
        conditions: 'Drought in mid-season, recovered with irrigation'
      },
      {
        year: new Date().getFullYear() - 3,
        yield: 8.2,
        conditions: 'Average growing conditions'
      }
    ];
  }
  
  /**
   * Perform yield prediction using AI
   */
  private async performYieldPrediction(
    parcelData: any,
    measurements: any[],
    weatherForecast: any,
    historicalYields: any[]
  ): Promise<YieldPredictionResult> {
    try {
      const prompt = `
      Predict the yield for the following agricultural parcel:
      
      PARCEL INFORMATION:
      ${JSON.stringify(parcelData, null, 2)}
      
      RECENT MEASUREMENTS:
      ${JSON.stringify(measurements, null, 2)}
      
      WEATHER FORECAST:
      ${JSON.stringify(weatherForecast, null, 2)}
      
      HISTORICAL YIELDS:
      ${JSON.stringify(historicalYields, null, 2)}
      
      Provide a comprehensive yield prediction with:
      1. Predicted yield amount with confidence interval
      2. Factors affecting the yield
      3. Comparison to regional average
      4. Harvest date estimate
      5. Quality prediction
      6. Market value estimate
      
      Return your prediction in JSON format matching the YieldPredictionResult type.
      `;
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an agricultural yield forecasting expert. Predict crop yields based on environmental and historical data in JSON format."
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
      
      // Parse the AI-generated prediction
      const prediction = JSON.parse(content) as YieldPredictionResult;
      
      return prediction;
    } catch (error) {
      logger.error('Error performing yield prediction', error);
      throw error;
    }
  }
}