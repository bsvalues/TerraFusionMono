import { storage } from "../../storage";
import OpenAI from "openai";

// Make sure we have an OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.warn("Warning: OPENAI_API_KEY is not set. Crop health AI analysis will not work.");
}

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? 
  new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : 
  null;

// Soil Analyzer
class SoilAnalyzer {
  async analyzeSoil(parcelId: string) {
    try {
      // Get parcel data
      const parcel = await storage.getParcelByExternalId(parcelId);
      if (!parcel) {
        throw new Error(`Parcel with ID ${parcelId} not found`);
      }
      
      // Get parcel measurements related to soil
      const soilMeasurements = await storage.getParcelMeasurements({
        parcelId,
        measurementType: 'soil'
      });
      
      // If we have OpenAI available, we can generate soil analysis
      if (openai) {
        const prompt = `
          Generate a comprehensive soil analysis for a ${parcel.cropType} field based on these measurements:
          ${JSON.stringify(soilMeasurements)}
          
          Include the following information in your analysis:
          - Soil type
          - pH level
          - Organic matter percentage
          - Nitrogen levels (ppm)
          - Phosphorus levels (ppm)
          - Potassium levels (ppm)
          - Water retention quality (poor, fair, good, excellent)
          - Any nutrient deficiencies with severity (mild, moderate, severe)
          - Overall suitability score for the crop (0-100)
          - Specific recommendations for improving soil quality
          
          Format your response as a valid JSON object with these exact fields:
          {
            "soilType": string,
            "ph": number,
            "organicMatter": number,
            "nitrogenLevel": number,
            "phosphorusLevel": number,
            "potassiumLevel": number,
            "waterRetention": string,
            "deficiencies": [{"nutrient": string, "severity": string}],
            "suitabilityScore": number,
            "recommendations": [string]
          }
        `;
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            { role: "system", content: "You are an expert agricultural soil analyst providing detailed soil analysis." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        });
        
        // Parse the response
        const soilAnalysis = JSON.parse(response.choices[0].message.content);
        
        // Add parcel ID and timestamp
        return {
          parcelId,
          ...soilAnalysis,
          timestamp: new Date().toISOString()
        };
      } else {
        // If no OpenAI available, return a message
        throw new Error("OpenAI API key not available for soil analysis");
      }
    } catch (error: any) {
      console.error(`Error in soil analysis: ${error.message}`);
      throw error;
    }
  }
}

// Disease Detector
class DiseaseDetector {
  async detectDiseases(parcelId: string) {
    try {
      // Get parcel data
      const parcel = await storage.getParcelByExternalId(parcelId);
      if (!parcel) {
        throw new Error(`Parcel with ID ${parcelId} not found`);
      }
      
      // Get image measurements that might show diseases
      const imageMeasurements = await storage.getParcelMeasurements({
        parcelId,
        measurementType: 'image'
      });
      
      // If we have OpenAI available, we can detect diseases
      if (openai) {
        const prompt = `
          Analyze these crop images and data for a ${parcel.cropType} field:
          ${JSON.stringify(imageMeasurements)}
          
          Identify any potential crop diseases, including:
          - Disease name and scientific name
          - Severity level (low, moderate, high, severe)
          - Estimated spread percentage
          - Affected areas of the field
          - Visible symptoms
          - Treatment recommendations
          
          Also provide a risk assessment including:
          - Spread risk (low, moderate, high)
          - Economic impact (low, moderate, high)
          - Control difficulty (easy, moderate, difficult)
          
          Format your response as a valid JSON object with these exact fields:
          {
            "detectedDiseases": [
              {
                "name": string,
                "scientificName": string,
                "severity": string,
                "spreadPercentage": number,
                "affectedAreas": [string],
                "symptoms": [string],
                "treatmentRecommendations": [string],
                "images": [{"url": string, "timestamp": string, "location": string}]
              }
            ],
            "riskAssessment": {
              "spreadRisk": string,
              "economicImpact": string,
              "controlDifficulty": string
            }
          }
        `;
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            { role: "system", content: "You are an expert agricultural pathologist specializing in crop disease identification." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        });
        
        // Parse the response
        const diseaseAnalysis = JSON.parse(response.choices[0].message.content);
        
        // Add parcel ID and scan date
        return {
          parcelId,
          cropType: parcel.cropType,
          scanDate: new Date().toISOString(),
          ...diseaseAnalysis
        };
      } else {
        // If no OpenAI available, return a message
        throw new Error("OpenAI API key not available for disease detection");
      }
    } catch (error: any) {
      console.error(`Error in disease detection: ${error.message}`);
      throw error;
    }
  }
}

// Yield Predictor
class YieldPredictor {
  async predictYield(parcelId: string) {
    try {
      // Get parcel data
      const parcel = await storage.getParcelByExternalId(parcelId);
      if (!parcel) {
        throw new Error(`Parcel with ID ${parcelId} not found`);
      }
      
      // Get relevant measurements for yield prediction
      const yieldMeasurements = await storage.getParcelMeasurements({
        parcelId
      });
      
      // Get historical yield data
      const notes = await storage.getParcelNoteByParcelId(parcelId);
      
      // If we have OpenAI available, we can predict yield
      if (openai) {
        const prompt = `
          Generate a yield prediction for a ${parcel.cropType} field based on:
          Field measurements: ${JSON.stringify(yieldMeasurements)}
          Historical notes: ${notes ? JSON.stringify(notes) : "No historical notes available"}
          
          Include in your analysis:
          - Predicted yield value and unit (e.g., bushels/acre)
          - Confidence interval (low and high values)
          - Confidence level (0-1)
          - Alternative yield scenarios based on different conditions
          - Estimated market value (per unit and total)
          - Estimated harvest date
          - Historical yield comparisons for the past few years
          
          Format your response as a valid JSON object with these exact fields:
          {
            "predictedYield": {
              "value": number,
              "unit": string
            },
            "confidenceInterval": {
              "low": number,
              "high": number
            },
            "confidenceLevel": number,
            "scenarios": [
              {
                "name": string,
                "yieldChange": number,
                "probability": number
              }
            ],
            "marketValueEstimate": {
              "perUnit": number,
              "total": number,
              "currency": string
            },
            "harvestDateEstimate": string,
            "historicalYields": [
              {"year": number, "yield": number}
            ]
          }
        `;
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            { role: "system", content: "You are an expert agricultural yield analyst with deep knowledge of crop prediction models." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        });
        
        // Parse the response
        const yieldPrediction = JSON.parse(response.choices[0].message.content);
        
        // Add parcel ID, crop type, and last updated timestamp
        return {
          parcelId,
          cropType: parcel.cropType,
          ...yieldPrediction,
          lastUpdated: new Date().toISOString()
        };
      } else {
        // If no OpenAI available, return a message
        throw new Error("OpenAI API key not available for yield prediction");
      }
    } catch (error: any) {
      console.error(`Error in yield prediction: ${error.message}`);
      throw error;
    }
  }
}

// Weather Service
class WeatherService {
  async getWeatherData(parcelId: string) {
    try {
      // Get parcel data
      const parcel = await storage.getParcelByExternalId(parcelId);
      if (!parcel) {
        throw new Error(`Parcel with ID ${parcelId} not found`);
      }
      
      // Get weather measurements
      const weatherMeasurements = await storage.getParcelMeasurements({
        parcelId,
        measurementType: 'weather'
      });
      
      // If we have OpenAI available, we can generate weather analysis
      if (openai) {
        const prompt = `
          Generate a comprehensive weather forecast for a ${parcel.cropType} field based on:
          Weather measurements: ${JSON.stringify(weatherMeasurements)}
          
          Include in your analysis:
          - Current weather conditions (temperature, humidity, precipitation, wind)
          - 7-day forecast with daily conditions, temperature ranges, and precipitation
          - Any severe weather alerts
          - Agricultural advisories related to the weather
          
          Format your response as a valid JSON object with these exact fields:
          {
            "current": {
              "temperature": number,
              "humidity": number,
              "precipitation": number,
              "windSpeed": number,
              "windDirection": number,
              "conditions": string,
              "timestamp": string
            },
            "forecast": [
              {
                "date": string,
                "conditions": string,
                "temperatureMin": number,
                "temperatureMax": number,
                "temperatureAvg": number,
                "precipitation": number,
                "humidity": number,
                "windSpeed": number,
                "windDirection": number
              }
            ],
            "alerts": [
              {
                "type": string,
                "message": string,
                "severity": string,
                "expiresAt": string
              }
            ],
            "advisories": [
              {
                "type": string,
                "message": string
              }
            ]
          }
        `;
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            { role: "system", content: "You are an expert agricultural meteorologist providing detailed weather analysis and forecasts." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        });
        
        // Parse the response
        const weatherData = JSON.parse(response.choices[0].message.content);
        
        // Add parcel ID
        return {
          parcelId,
          ...weatherData
        };
      } else {
        // If no OpenAI available, return a message
        throw new Error("OpenAI API key not available for weather analysis");
      }
    } catch (error: any) {
      console.error(`Error in weather analysis: ${error.message}`);
      throw error;
    }
  }
}

// Health Status
class HealthStatusService {
  async getCropHealthStatus(parcelId: string) {
    try {
      // Get parcel data
      const parcel = await storage.getParcelByExternalId(parcelId);
      if (!parcel) {
        throw new Error(`Parcel with ID ${parcelId} not found`);
      }
      
      // Get all measurements for health assessment
      const measurements = await storage.getParcelMeasurements({
        parcelId
      });
      
      // If we have OpenAI available, we can generate health status
      if (openai) {
        const prompt = `
          Generate a comprehensive crop health status for a ${parcel.cropType} field based on:
          Field measurements: ${JSON.stringify(measurements)}
          
          Include in your analysis:
          - Overall health rating (poor, fair, good, excellent)
          - Health score (0-100)
          - Current growth stage
          - Days remaining until estimated harvest
          - Estimated harvest date
          - Any alerts or issues that need attention
          
          Format your response as a valid JSON object with these exact fields:
          {
            "parcelName": string,
            "overallHealth": string,
            "healthScore": number,
            "growthStage": string,
            "daysToHarvest": number,
            "estimatedHarvestDate": string,
            "alerts": [
              {
                "type": string,
                "message": string
              }
            ]
          }
        `;
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            { role: "system", content: "You are an expert agricultural crop health analyst providing detailed status assessments." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        });
        
        // Parse the response
        const healthStatus = JSON.parse(response.choices[0].message.content);
        
        // Add parcel ID, crop type, and timestamp
        return {
          parcelId,
          cropType: parcel.cropType,
          ...healthStatus,
          lastUpdated: new Date().toISOString()
        };
      } else {
        // If no OpenAI available, return a message
        throw new Error("OpenAI API key not available for health status assessment");
      }
    } catch (error: any) {
      console.error(`Error in health status assessment: ${error.message}`);
      throw error;
    }
  }
}

// Instantiate the analyzers
const soilAnalyzer = new SoilAnalyzer();
const diseaseDetector = new DiseaseDetector();
const yieldPredictor = new YieldPredictor();
const weatherService = new WeatherService();
const healthStatusService = new HealthStatusService();

// Main Crop Health Service that coordinates the analyzers
class CropHealthService {
  async getCropHealthData(parcelId: string) {
    try {
      return await healthStatusService.getCropHealthStatus(parcelId);
    } catch (error: any) {
      console.error(`Error in crop health service: ${error.message}`);
      throw error;
    }
  }
  
  async getSoilAnalysis(parcelId: string) {
    try {
      return await soilAnalyzer.analyzeSoil(parcelId);
    } catch (error: any) {
      console.error(`Error in soil analysis: ${error.message}`);
      throw error;
    }
  }
  
  async getDiseaseDetections(parcelId: string) {
    try {
      return await diseaseDetector.detectDiseases(parcelId);
    } catch (error: any) {
      console.error(`Error in disease detection: ${error.message}`);
      throw error;
    }
  }
  
  async getYieldPrediction(parcelId: string) {
    try {
      return await yieldPredictor.predictYield(parcelId);
    } catch (error: any) {
      console.error(`Error in yield prediction: ${error.message}`);
      throw error;
    }
  }
  
  async getWeatherData(parcelId: string) {
    try {
      return await weatherService.getWeatherData(parcelId);
    } catch (error: any) {
      console.error(`Error in weather data: ${error.message}`);
      throw error;
    }
  }
}

// Export the service
export const cropHealthService = new CropHealthService();