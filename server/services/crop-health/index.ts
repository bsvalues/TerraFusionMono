import { storage } from "../../storage";
import OpenAI from "openai";
import { logsService } from "../logs";

// Check for OpenAI API key
const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

class CropHealthService {
  private readonly SERVICE_NAME = "crop-health";

  async getCropHealthData(parcelId: string) {
    try {
      // Log the request
      await logsService.createLog({
        level: "INFO",
        service: this.SERVICE_NAME,
        message: `Fetching crop health data for parcel: ${parcelId}`
      });

      // Get parcel details
      const parcel = await storage.getParcelByExternalId(parcelId);
      if (!parcel) {
        throw new Error(`Parcel with ID ${parcelId} not found`);
      }

      // Get the latest crop health measurements for this parcel
      const measurements = await storage.getParcelMeasurements({
        parcelId,
        measurementType: "crop-health",
        limit: 1
      });

      // If we already have recent data, return it
      if (measurements.length > 0) {
        const latestMeasurement = measurements[0];
        // Check if the data is less than 24 hours old
        const measurementTime = new Date(latestMeasurement.timestamp);
        const now = new Date();
        const hoursSinceUpdate = (now.getTime() - measurementTime.getTime()) / (1000 * 60 * 60);

        if (hoursSinceUpdate < 24) {
          return JSON.parse(latestMeasurement.data as string);
        }
      }

      // Generate crop health data using AI
      return this.generateCropHealthData(parcel);
    } catch (error: any) {
      // Log the error
      await logsService.createLog({
        level: "ERROR",
        service: this.SERVICE_NAME,
        message: `Error fetching crop health data: ${error.message}`
      });
      throw error;
    }
  }

  async getSoilAnalysis(parcelId: string) {
    try {
      await logsService.createLog({
        level: "INFO",
        service: this.SERVICE_NAME,
        message: `Fetching soil analysis for parcel: ${parcelId}`
      });

      // Get parcel details
      const parcel = await storage.getParcelByExternalId(parcelId);
      if (!parcel) {
        throw new Error(`Parcel with ID ${parcelId} not found`);
      }

      // Get the latest soil measurements for this parcel
      const measurements = await storage.getParcelMeasurements({
        parcelId,
        measurementType: "soil-analysis",
        limit: 1
      });

      if (measurements.length > 0) {
        const latestMeasurement = measurements[0];
        // Check if the data is less than 48 hours old
        const measurementTime = new Date(latestMeasurement.timestamp);
        const now = new Date();
        const hoursSinceUpdate = (now.getTime() - measurementTime.getTime()) / (1000 * 60 * 60);

        if (hoursSinceUpdate < 48) {
          return JSON.parse(latestMeasurement.data as string);
        }
      }

      // Generate soil analysis data using AI
      return this.generateSoilAnalysis(parcel);
    } catch (error: any) {
      await logsService.createLog({
        level: "ERROR",
        service: this.SERVICE_NAME,
        message: `Error fetching soil analysis: ${error.message}`
      });
      throw error;
    }
  }

  async getDiseaseDetections(parcelId: string) {
    try {
      await logsService.createLog({
        level: "INFO",
        service: this.SERVICE_NAME,
        message: `Fetching disease detections for parcel: ${parcelId}`
      });

      // Get parcel details
      const parcel = await storage.getParcelByExternalId(parcelId);
      if (!parcel) {
        throw new Error(`Parcel with ID ${parcelId} not found`);
      }

      // Get the latest disease detection measurements for this parcel
      const measurements = await storage.getParcelMeasurements({
        parcelId,
        measurementType: "disease-detection",
        limit: 1
      });

      if (measurements.length > 0) {
        const latestMeasurement = measurements[0];
        // Disease detection data is considered valid for only 24 hours
        const measurementTime = new Date(latestMeasurement.timestamp);
        const now = new Date();
        const hoursSinceUpdate = (now.getTime() - measurementTime.getTime()) / (1000 * 60 * 60);

        if (hoursSinceUpdate < 24) {
          return JSON.parse(latestMeasurement.data as string);
        }
      }

      // Generate disease detection data using AI
      return this.generateDiseaseDetections(parcel);
    } catch (error: any) {
      await logsService.createLog({
        level: "ERROR",
        service: this.SERVICE_NAME,
        message: `Error fetching disease detections: ${error.message}`
      });
      throw error;
    }
  }

  async getYieldPrediction(parcelId: string) {
    try {
      await logsService.createLog({
        level: "INFO",
        service: this.SERVICE_NAME,
        message: `Fetching yield predictions for parcel: ${parcelId}`
      });

      // Get parcel details
      const parcel = await storage.getParcelByExternalId(parcelId);
      if (!parcel) {
        throw new Error(`Parcel with ID ${parcelId} not found`);
      }

      // Get the latest yield prediction measurements for this parcel
      const measurements = await storage.getParcelMeasurements({
        parcelId,
        measurementType: "yield-prediction",
        limit: 1
      });

      if (measurements.length > 0) {
        const latestMeasurement = measurements[0];
        // Yield predictions are valid for up to 3 days (72 hours)
        const measurementTime = new Date(latestMeasurement.timestamp);
        const now = new Date();
        const hoursSinceUpdate = (now.getTime() - measurementTime.getTime()) / (1000 * 60 * 60);

        if (hoursSinceUpdate < 72) {
          return JSON.parse(latestMeasurement.data as string);
        }
      }

      // Generate yield prediction data using AI
      return this.generateYieldPrediction(parcel);
    } catch (error: any) {
      await logsService.createLog({
        level: "ERROR",
        service: this.SERVICE_NAME,
        message: `Error fetching yield predictions: ${error.message}`
      });
      throw error;
    }
  }

  async getWeatherData(parcelId: string) {
    try {
      await logsService.createLog({
        level: "INFO",
        service: this.SERVICE_NAME,
        message: `Fetching weather data for parcel: ${parcelId}`
      });

      // Get parcel details
      const parcel = await storage.getParcelByExternalId(parcelId);
      if (!parcel) {
        throw new Error(`Parcel with ID ${parcelId} not found`);
      }

      // Weather data is always generated fresh since it changes rapidly
      // In a real implementation, this would call a weather API using the parcel coordinates
      return this.generateWeatherData(parcel);
    } catch (error: any) {
      await logsService.createLog({
        level: "ERROR",
        service: this.SERVICE_NAME,
        message: `Error fetching weather data: ${error.message}`
      });
      throw error;
    }
  }

  // Private helper methods for data generation
  private async generateCropHealthData(parcel: any) {
    // Generate data with OpenAI if available, otherwise create sample data
    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "You are an agricultural AI assistant specialized in crop health analysis. Generate realistic crop health data based on the provided parcel information."
            },
            {
              role: "user",
              content: JSON.stringify({
                parcelId: parcel.externalId,
                parcelName: parcel.name,
                location: parcel.location,
                acreage: parcel.acreage,
                cropType: parcel.cropType || "corn",
                soilType: parcel.soilType || "loam",
                plantingDate: parcel.plantingDate || "2025-03-15",
                lastIrrigation: parcel.lastIrrigation || "2025-04-20",
                instruction: "Generate complete crop health data including overall health, health score, growth prediction, and risk factors."
              })
            }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        });

        const generatedData = JSON.parse(response.choices[0].message.content);
        
        // Store the generated data for future use
        await storage.createParcelMeasurement({
          parcelId: parcel.externalId,
          userId: parcel.userId,
          measurementType: "crop-health",
          data: JSON.stringify(generatedData),
          timestamp: new Date().toISOString()
        });

        return generatedData;
      } catch (error: any) {
        await logsService.createLog({
          level: "ERROR",
          service: this.SERVICE_NAME,
          message: `Error generating crop health data with AI: ${error.message}`
        });
        // Fall back to sample data if AI fails
      }
    }

    // Sample crop health data for demonstration
    const cropHealthData = {
      parcelId: parcel.externalId,
      parcelName: parcel.name,
      cropType: parcel.cropType || "corn",
      overallHealth: "good",
      healthScore: 82,
      analysisDate: new Date().toISOString(),
      growthPrediction: {
        currentStage: "V6 - Six Leaf",
        daysToHarvest: 95,
        estimatedHarvestDate: "2025-07-15",
        growthRateStatus: "normal"
      },
      riskFactors: [
        {
          type: "water",
          level: "medium",
          description: "Moderate water stress detected in northwestern section"
        },
        {
          type: "nutrient",
          level: "low",
          description: "Minor nitrogen deficiency"
        }
      ]
    };

    // Store the sample data
    await storage.createParcelMeasurement({
      parcelId: parcel.externalId,
      userId: parcel.userId,
      measurementType: "crop-health",
      data: JSON.stringify(cropHealthData),
      timestamp: new Date().toISOString()
    });

    return cropHealthData;
  }

  private async generateSoilAnalysis(parcel: any) {
    // Generate data with OpenAI if available, otherwise create sample data
    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "You are an agricultural AI assistant specialized in soil analysis. Generate realistic soil analysis data based on the provided parcel information."
            },
            {
              role: "user",
              content: JSON.stringify({
                parcelId: parcel.externalId,
                parcelName: parcel.name,
                location: parcel.location,
                acreage: parcel.acreage,
                cropType: parcel.cropType || "corn",
                soilType: parcel.soilType || "loam",
                instruction: "Generate complete soil analysis including pH, organic matter, nutrient levels, water retention, and suitability score."
              })
            }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        });

        const generatedData = JSON.parse(response.choices[0].message.content);
        
        // Store the generated data for future use
        await storage.createParcelMeasurement({
          parcelId: parcel.externalId,
          userId: parcel.userId,
          measurementType: "soil-analysis",
          data: JSON.stringify(generatedData),
          timestamp: new Date().toISOString()
        });

        return generatedData;
      } catch (error: any) {
        await logsService.createLog({
          level: "ERROR",
          service: this.SERVICE_NAME,
          message: `Error generating soil analysis with AI: ${error.message}`
        });
        // Fall back to sample data if AI fails
      }
    }

    // Sample soil analysis data for demonstration
    const soilAnalysis = {
      parcelId: parcel.externalId,
      soilType: parcel.soilType || "loam",
      ph: 6.8,
      organicMatter: 3.2,
      nitrogenLevel: 42,
      phosphorusLevel: 28,
      potassiumLevel: 195,
      waterRetention: "good",
      deficiencies: [
        {
          nutrient: "magnesium",
          severity: "mild"
        }
      ],
      suitabilityScore: 87,
      timestamp: new Date().toISOString(),
      recommendations: [
        "Apply magnesium supplement at 15 lbs/acre",
        "Maintain current irrigation schedule"
      ]
    };

    // Store the sample data
    await storage.createParcelMeasurement({
      parcelId: parcel.externalId,
      userId: parcel.userId,
      measurementType: "soil-analysis",
      data: JSON.stringify(soilAnalysis),
      timestamp: new Date().toISOString()
    });

    return soilAnalysis;
  }

  private async generateDiseaseDetections(parcel: any) {
    // Generate data with OpenAI if available, otherwise create sample data
    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "You are an agricultural AI assistant specialized in crop disease detection. Generate realistic disease detection data based on the provided parcel information."
            },
            {
              role: "user",
              content: JSON.stringify({
                parcelId: parcel.externalId,
                parcelName: parcel.name,
                location: parcel.location,
                acreage: parcel.acreage,
                cropType: parcel.cropType || "corn",
                soilType: parcel.soilType || "loam",
                instruction: "Generate realistic crop disease detection data including detected diseases, severity, spread percentage, and treatment recommendations."
              })
            }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        });

        const generatedData = JSON.parse(response.choices[0].message.content);
        
        // Store the generated data for future use
        await storage.createParcelMeasurement({
          parcelId: parcel.externalId,
          userId: parcel.userId,
          measurementType: "disease-detection",
          data: JSON.stringify(generatedData),
          timestamp: new Date().toISOString()
        });

        return generatedData;
      } catch (error: any) {
        await logsService.createLog({
          level: "ERROR",
          service: this.SERVICE_NAME,
          message: `Error generating disease detection data with AI: ${error.message}`
        });
        // Fall back to sample data if AI fails
      }
    }

    // Sample disease detection data for demonstration
    const diseaseData = {
      parcelId: parcel.externalId,
      scanDate: new Date().toISOString(),
      cropType: parcel.cropType || "corn",
      detectedDiseases: [
        {
          name: "Northern Corn Leaf Blight",
          scientificName: "Exserohilum turcicum",
          severity: "low",
          spreadPercentage: 8,
          affectedAreas: ["northeastern corner"],
          symptoms: ["Long elliptical gray-green lesions", "Brown spots with yellow halos"],
          treatmentRecommendations: [
            "Apply foliar fungicide - Propiconazole",
            "Monitor spread every 3 days"
          ],
          images: [
            {
              url: "/assets/diseases/northern-corn-leaf-blight.jpg",
              timestamp: new Date().toISOString(),
              location: "Section A, Northeast"
            }
          ]
        }
      ],
      riskAssessment: {
        spreadRisk: "moderate",
        economicImpact: "low",
        controlDifficulty: "easy"
      }
    };

    // Store the sample data
    await storage.createParcelMeasurement({
      parcelId: parcel.externalId,
      userId: parcel.userId,
      measurementType: "disease-detection",
      data: JSON.stringify(diseaseData),
      timestamp: new Date().toISOString()
    });

    return diseaseData;
  }

  private async generateYieldPrediction(parcel: any) {
    // Generate data with OpenAI if available, otherwise create sample data
    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "You are an agricultural AI assistant specialized in crop yield prediction. Generate realistic yield prediction data based on the provided parcel information."
            },
            {
              role: "user",
              content: JSON.stringify({
                parcelId: parcel.externalId,
                parcelName: parcel.name,
                location: parcel.location,
                acreage: parcel.acreage,
                cropType: parcel.cropType || "corn",
                soilType: parcel.soilType || "loam",
                plantingDate: parcel.plantingDate || "2025-03-15",
                instruction: "Generate complete yield prediction data including predicted yield, confidence interval, different scenarios, market value estimates, and historical yields."
              })
            }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        });

        const generatedData = JSON.parse(response.choices[0].message.content);
        
        // Store the generated data for future use
        await storage.createParcelMeasurement({
          parcelId: parcel.externalId,
          userId: parcel.userId,
          measurementType: "yield-prediction",
          data: JSON.stringify(generatedData),
          timestamp: new Date().toISOString()
        });

        return generatedData;
      } catch (error: any) {
        await logsService.createLog({
          level: "ERROR",
          service: this.SERVICE_NAME,
          message: `Error generating yield prediction with AI: ${error.message}`
        });
        // Fall back to sample data if AI fails
      }
    }

    // Sample yield prediction data for demonstration
    const yieldData = {
      parcelId: parcel.externalId,
      cropType: parcel.cropType || "corn",
      predictedYield: {
        value: 175,
        unit: "bushels/acre"
      },
      confidenceInterval: {
        low: 162,
        high: 189
      },
      confidenceLevel: 0.95,
      scenarios: [
        {
          name: "Drought conditions",
          yieldChange: -23,
          probability: 0.15
        },
        {
          name: "Optimal conditions",
          yieldChange: 12,
          probability: 0.35
        },
        {
          name: "Heavy rainfall",
          yieldChange: -10,
          probability: 0.20
        }
      ],
      marketValueEstimate: {
        perUnit: 4.75,
        total: parcel.acreage * 175 * 4.75,
        currency: "USD"
      },
      harvestDateEstimate: "2025-07-15",
      historicalYields: [
        { year: 2024, yield: 168 },
        { year: 2023, yield: 172 },
        { year: 2022, yield: 159 },
        { year: 2021, yield: 183 }
      ],
      lastUpdated: new Date().toISOString()
    };

    // Store the sample data
    await storage.createParcelMeasurement({
      parcelId: parcel.externalId,
      userId: parcel.userId,
      measurementType: "yield-prediction",
      data: JSON.stringify(yieldData),
      timestamp: new Date().toISOString()
    });

    return yieldData;
  }

  private async generateWeatherData(parcel: any) {
    // Sample weather data for demonstration
    const now = new Date();
    
    // Generate a 7-day forecast
    const forecast = Array.from({ length: 7 }, (_, i) => {
      const forecastDate = new Date();
      forecastDate.setDate(now.getDate() + i + 1);
      
      // Generate pseudo-random but realistic values
      const tempMin = 65 + Math.floor(Math.sin(i * 0.5) * 8);
      const tempMax = 85 + Math.floor(Math.sin(i * 0.5) * 8);
      const conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Thunderstorms"];
      const conditionIndex = Math.floor(Math.abs(Math.sin(i * 0.8) * 5)) % conditions.length;
      
      return {
        date: forecastDate.toISOString().split('T')[0],
        conditions: conditions[conditionIndex],
        temperatureMin: tempMin,
        temperatureMax: tempMax,
        temperatureAvg: Math.round((tempMin + tempMax) / 2),
        precipitation: conditionIndex > 2 ? 0.1 + Math.random() * 0.9 : 0,
        humidity: 40 + Math.floor(Math.sin(i * 0.7) * 25),
        windSpeed: 5 + Math.floor(Math.sin(i * 0.4) * 10),
        windDirection: Math.floor(Math.random() * 360)
      };
    });
    
    const weatherData = {
      parcelId: parcel.externalId,
      current: {
        temperature: 78,
        humidity: 65,
        precipitation: 0,
        windSpeed: 8,
        windDirection: 225,
        conditions: "Partly Cloudy",
        timestamp: now.toISOString()
      },
      forecast: forecast,
      alerts: [],
      advisories: [
        {
          type: "irrigation",
          message: "Consider irrigation in the next 48 hours due to dry conditions"
        }
      ]
    };

    return weatherData;
  }
}

export const cropHealthService = new CropHealthService();