import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { PestRiskType, RiskLevel } from '../models';

/**
 * Disease Detection Result
 */
export interface DiseaseDetectionResult {
  detectedDiseases: Array<{
    name: string;
    type: PestRiskType;
    confidence: number; // 0-1
    severity: RiskLevel;
    affectedArea: number; // percentage of field affected
    symptoms: string[];
    progression: 'early' | 'developing' | 'advanced';
  }>;
  recommendedTreatments: Array<{
    diseaseId: string;
    treatments: string[];
    applicationMethod: string;
    expectedResults: string;
    timeToEffect: string;
  }>;
  preventiveMeasures: string[];
  riskOfSpread: number; // 0-1
  estimatedYieldImpact: number; // percentage
}

/**
 * Image Analysis Result
 */
export interface ImageAnalysisResult {
  hasDisease: boolean;
  detectedDiseases: string[];
  affectedAreas: string[];
  confidence: number; // 0-1
  recommendations: string[];
}

/**
 * Disease Detector
 * 
 * Specialized component for detecting and analyzing crop diseases
 */
export class DiseaseDetector {
  private openai: OpenAI;
  
  constructor() {
    // Initialize OpenAI with API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required for disease detection');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    logger.info('DiseaseDetector initialized');
  }
  
  /**
   * Detect diseases based on parcel data and measurements
   * @param parcelId The parcel ID
   * @param reportedSymptoms Optional array of reported symptoms
   * @returns Disease detection results
   */
  async detectDiseases(parcelId: number, reportedSymptoms?: string[]): Promise<DiseaseDetectionResult> {
    logger.info(`Detecting diseases for parcel ${parcelId}`);
    
    try {
      // Get parcel data
      const parcelData = await this.getParcelData(parcelId);
      
      // Get recent measurements
      const measurements = await this.getParcelMeasurements(parcelId);
      
      // Get weather data (important for disease prediction)
      const weatherData = await this.getWeatherData(parcelData.coordinates);
      
      // Perform AI analysis
      const analysis = await this.performDiseaseAnalysis(
        parcelData,
        measurements,
        weatherData,
        reportedSymptoms
      );
      
      logger.info(`Disease detection completed for parcel ${parcelId}`);
      return analysis;
    } catch (error) {
      logger.error(`Error detecting diseases for parcel ${parcelId}`, error);
      throw new Error(`Disease detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Analyze an image for signs of crop disease
   * @param base64Image The base64-encoded image data
   * @param cropType The type of crop in the image
   * @returns Image analysis results
   */
  async analyzeImage(base64Image: string, cropType: string): Promise<ImageAnalysisResult> {
    logger.info(`Analyzing image for disease detection in ${cropType}`);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an agricultural disease expert. Analyze the image for signs of crop diseases or pests."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image of ${cropType} for any signs of disease, pest damage, or nutrient deficiencies. Provide a detailed assessment of the plant health.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ]
      });
      
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from AI service');
      }
      
      // Process the text response into a structured format
      // For now, we'll use another AI call to structure the data
      const structuredResponse = await this.openai.chat.completions.create({
        model: "gpt-4o",  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Convert the following crop disease analysis into a structured JSON format matching the ImageAnalysisResult interface with properties: hasDisease, detectedDiseases, affectedAreas, confidence, and recommendations."
          },
          {
            role: "user",
            content: content
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const structuredContent = structuredResponse.choices[0].message.content;
      if (!structuredContent) {
        throw new Error('Failed to structure analysis results');
      }
      
      const result = JSON.parse(structuredContent) as ImageAnalysisResult;
      logger.info(`Image analysis completed with ${result.detectedDiseases.length} detected diseases`);
      
      return result;
    } catch (error) {
      logger.error('Error analyzing image for disease detection', error);
      throw new Error(`Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Estimate disease spread risk based on current conditions
   * @param parcelId The parcel ID
   * @param diseaseType The type of disease to assess
   * @returns Disease spread risk (0-1)
   */
  async estimateDiseaseSpreadRisk(parcelId: number, diseaseType: string): Promise<number> {
    logger.info(`Estimating disease spread risk for ${diseaseType} in parcel ${parcelId}`);
    
    try {
      // Get relevant data
      const parcelData = await this.getParcelData(parcelId);
      const weatherData = await this.getWeatherData(parcelData.coordinates);
      
      // In a real implementation, this would use a more sophisticated model
      // For now, we'll simulate a risk calculation
      const humidity = weatherData.current.humidity / 100; // 0-1
      const temperature = Math.min(Math.max(weatherData.current.temperature, 0), 35) / 35; // 0-1 scale
      
      // Different diseases have different optimal conditions
      let risk = 0;
      
      if (diseaseType.includes('rust') || diseaseType.includes('mildew') || diseaseType.includes('blight')) {
        // These diseases thrive in humid conditions
        risk = 0.3 + (humidity * 0.7);
      } else if (diseaseType.includes('rot') || diseaseType.includes('wilt')) {
        // These are often moisture and temperature dependent
        risk = 0.2 + (humidity * 0.4) + (temperature * 0.4);
      } else {
        // Generic calculation
        risk = 0.1 + (humidity * 0.5) + (temperature * 0.4);
      }
      
      // Clamp to 0-1 range
      risk = Math.max(0, Math.min(1, risk));
      
      logger.info(`Estimated disease spread risk for ${diseaseType}: ${risk}`);
      return risk;
    } catch (error) {
      logger.error(`Error estimating disease spread risk for ${diseaseType}`, error);
      throw new Error(`Risk estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      plantingDate: new Date(new Date().setDate(new Date().getDate() - 30)),
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
   * Fetch weather data
   */
  private async getWeatherData(coordinates: { latitude: number, longitude: number }): Promise<any> {
    // In a real implementation, this would call a weather API
    // For now, return placeholder data
    return {
      current: {
        temperature: 22,
        humidity: 70,
        conditions: 'Clear'
      },
      forecast: [],
      historical: []
    };
  }
  
  /**
   * Perform disease analysis using AI
   */
  private async performDiseaseAnalysis(
    parcelData: any,
    measurements: any[],
    weatherData: any,
    reportedSymptoms?: string[]
  ): Promise<DiseaseDetectionResult> {
    try {
      const prompt = `
      Analyze the following agricultural data to detect potential diseases and provide treatment recommendations:
      
      PARCEL INFORMATION:
      ${JSON.stringify(parcelData, null, 2)}
      
      RECENT MEASUREMENTS:
      ${JSON.stringify(measurements, null, 2)}
      
      WEATHER DATA:
      ${JSON.stringify(weatherData, null, 2)}
      
      REPORTED SYMPTOMS:
      ${reportedSymptoms ? JSON.stringify(reportedSymptoms, null, 2) : 'None reported'}
      
      Provide a comprehensive disease analysis with:
      1. Detected diseases and their severity
      2. Affected areas and progression
      3. Recommended treatments
      4. Preventive measures
      5. Risk of spread and estimated yield impact
      
      Return your analysis in JSON format matching the DiseaseDetectionResult type.
      `;
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an agricultural pathologist and pest management expert. Analyze agricultural data to detect diseases and provide treatment recommendations in JSON format."
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
      const analysis = JSON.parse(content) as DiseaseDetectionResult;
      
      return analysis;
    } catch (error) {
      logger.error('Error performing disease analysis', error);
      throw error;
    }
  }
}