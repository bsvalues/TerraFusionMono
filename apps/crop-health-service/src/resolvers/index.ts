import axios from 'axios';
import { 
  analyzeImages, 
  advancedAnalyze, 
  generateRecommendations 
} from '../../../shared/ai/crop-health-analysis';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Base URL for the REST API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Helper function to fetch data from the REST API
async function fetchFromApi(endpoint: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}${endpoint}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching from API (${endpoint}):`, error.message);
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
}

// Helper function to post data to the REST API
async function postToApi(endpoint: string, data: any) {
  try {
    const response = await axios.post(`${API_BASE_URL}${endpoint}`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Error posting to API (${endpoint}):`, error.message);
    throw new Error(`Failed to post data: ${error.message}`);
  }
}

// Helper to convert REST API response to GraphQL schema format
function mapCropHealthAnalysis(data: any) {
  return {
    id: data.id,
    parcelId: data.parcelId,
    timestamp: data.timestamp,
    cropType: data.cropType,
    healthStatus: mapHealthStatus(data.healthStatus),
    overallHealth: data.analysis?.healthScore || 0,
    issues: (data.analysis?.issues || []).map((issue: any, index: number) => ({
      id: `${data.id}-issue-${index}`,
      name: issue.name,
      description: issue.description,
      severity: issue.severity,
      affectedArea: issue.affectedArea,
      detectionConfidence: issue.confidence || 0.8,
      recommendedActions: issue.recommendedActions || []
    })),
    spatialDistribution: data.analysis?.spatialDistribution,
    temporalTrends: data.analysis?.temporalTrends,
    growthStage: data.analysis?.developmentStage,
    imageUrl: data.imageUrl,
    confidenceScore: data.analysis?.confidenceScore || 0.7,
    analyzedBy: data.analysis?.model || "gpt-4o"
  };
}

// Map string health status to enum value
function mapHealthStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'excellent': 'EXCELLENT',
    'good': 'GOOD',
    'moderate': 'MODERATE',
    'poor': 'POOR',
    'critical': 'CRITICAL'
  };
  
  return statusMap[status?.toLowerCase()] || 'MODERATE';
}

// GraphQL resolvers
export const resolvers = {
  Query: {
    // Crop Health Analysis Queries
    cropHealthAnalysis: async (_: any, { id }: { id: string }) => {
      const data = await fetchFromApi(`/api/crop-health/${id}`);
      return mapCropHealthAnalysis(data);
    },
    
    cropHealthAnalysesByParcel: async (_: any, { parcelId }: { parcelId: string }) => {
      const data = await fetchFromApi(`/api/crop-health/${parcelId}`);
      return Array.isArray(data) ? data.map(mapCropHealthAnalysis) : [mapCropHealthAnalysis(data)];
    },
    
    recentCropHealthAnalyses: async (_: any, { limit }: { limit: number }) => {
      const data = await fetchFromApi(`/api/reports/crop-health?limit=${limit || 10}`);
      return data.map(mapCropHealthAnalysis);
    },
    
    // Disease Detection Queries
    diseaseDetection: async (_: any, { id }: { id: string }) => {
      const data = await fetchFromApi(`/api/crop-health/diseases/${id}`);
      return data;
    },
    
    diseaseDetectionsByParcel: async (_: any, { parcelId }: { parcelId: string }) => {
      const data = await fetchFromApi(`/api/crop-health/diseases/${parcelId}`);
      return Array.isArray(data) ? data : [data];
    },
    
    // Soil Analysis Queries
    soilAnalysis: async (_: any, { id }: { id: string }) => {
      const data = await fetchFromApi(`/api/crop-health/soil/${id}`);
      return data;
    },
    
    soilAnalysesByParcel: async (_: any, { parcelId }: { parcelId: string }) => {
      const data = await fetchFromApi(`/api/crop-health/soil/${parcelId}`);
      return Array.isArray(data) ? data : [data];
    },
    
    // Yield Prediction Queries
    yieldPrediction: async (_: any, { id }: { id: string }) => {
      const data = await fetchFromApi(`/api/crop-health/yield/${id}`);
      return data;
    },
    
    yieldPredictionsByParcel: async (_: any, { parcelId }: { parcelId: string }) => {
      const data = await fetchFromApi(`/api/crop-health/yield/${parcelId}`);
      return Array.isArray(data) ? data : [data];
    },
    
    // Weather Data Queries
    weatherData: async (_: any, { id }: { id: string }) => {
      const data = await fetchFromApi(`/api/crop-health/weather/${id}`);
      return data;
    },
    
    weatherDataByParcel: async (_: any, { parcelId }: { parcelId: string }) => {
      const data = await fetchFromApi(`/api/crop-health/weather/${parcelId}`);
      return Array.isArray(data) ? data : [data];
    },
    
    weatherForecast: async (_: any, { parcelId }: { parcelId: string }) => {
      const data = await fetchFromApi(`/api/crop-health/weather/${parcelId}`);
      return data.forecast || [];
    },
  },
  
  Mutation: {
    // Crop Health Analysis Mutations
    createCropHealthAnalysis: async (_: any, { 
      parcelId, 
      cropType, 
      imageBase64 
    }: { 
      parcelId: string;
      cropType: string;
      imageBase64: string;
    }) => {
      try {
        // Use OpenAI for image analysis
        const analysisResult = await analyzeImages(openai, imageBase64, cropType);
        
        // Format the data for the API
        const formData = new FormData();
        formData.append('parcelId', parcelId);
        formData.append('cropType', cropType);
        
        // Convert base64 back to file
        const imageBuffer = Buffer.from(imageBase64, 'base64');
        const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
        formData.append('image', blob, 'crop-image.jpg');
        
        // Send to REST API
        const response = await postToApi('/api/crop-analysis/analyze', formData);
        
        // Combine REST response with AI analysis
        const result = {
          id: response.id || `analysis-${Date.now()}`,
          parcelId,
          timestamp: new Date().toISOString(),
          cropType,
          analysis: response.analysis || analysisResult,
          imageUrl: response.imageUrl || null
        };
        
        return mapCropHealthAnalysis(result);
      } catch (error: any) {
        console.error('Error creating crop health analysis:', error);
        throw new Error(`Failed to create crop health analysis: ${error.message}`);
      }
    },
    
    // Advanced Analysis
    createAdvancedCropAnalysis: async (_: any, { 
      parcelId,
      cropType,
      imagesBase64,
      soilType,
      weather,
      plantingDate,
      previousIssues
    }: { 
      parcelId: string;
      cropType: string;
      imagesBase64: string[];
      soilType?: string;
      weather?: string;
      plantingDate?: string;
      previousIssues?: string;
    }) => {
      try {
        // Use OpenAI for advanced image analysis
        const analysisResult = await advancedAnalyze(
          openai,
          imagesBase64,
          cropType,
          undefined, // location
          soilType,
          weather,
          plantingDate,
          previousIssues
        );
        
        // Convert the first base64 image back to file for the REST API
        const formData = new FormData();
        formData.append('parcelId', parcelId);
        formData.append('cropType', cropType);
        
        if (soilType) formData.append('soilType', soilType);
        if (weather) formData.append('weather', weather);
        if (plantingDate) formData.append('plantingDate', plantingDate);
        if (previousIssues) formData.append('previousIssues', previousIssues);
        
        // Add all images
        imagesBase64.forEach((base64, index) => {
          const imageBuffer = Buffer.from(base64, 'base64');
          const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
          formData.append('images', blob, `crop-image-${index}.jpg`);
        });
        
        // Send to REST API
        const response = await postToApi('/api/crop-analysis/advanced-analyze', formData);
        
        // Combine REST response with AI analysis
        const result = {
          id: response.id || `analysis-${Date.now()}`,
          parcelId,
          timestamp: new Date().toISOString(),
          cropType,
          analysis: response.analysis || analysisResult,
          imageUrl: response.imageUrl || null
        };
        
        return mapCropHealthAnalysis(result);
      } catch (error: any) {
        console.error('Error creating advanced crop analysis:', error);
        throw new Error(`Failed to create advanced crop analysis: ${error.message}`);
      }
    },
    
    // Disease Detection Mutations
    detectDiseases: async (_: any, { 
      parcelId,
      imageBase64,
      cropType
    }: { 
      parcelId: string;
      imageBase64: string;
      cropType: string;
    }) => {
      try {
        // This would call a specialized disease detection model
        // For now, we'll use the OpenAI model with a specific prompt
        const analysisResult = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
          messages: [
            {
              role: "system",
              content: 
                "You are an agricultural expert specializing in plant disease identification. " +
                "Analyze the provided crop image and identify any diseases present. " +
                "Structure your response as detailed JSON with the following fields: " +
                "diseaseName (string), pathogenType (string - virus/bacteria/fungus/pest), " +
                "severity (1-10), affectedArea (percentage), symptoms (array of strings), " +
                "progression (early/developing/advanced), " +
                "detectionConfidence (0-1), recommendedTreatments (array of objects), " +
                "and preventiveMeasures (array of strings).",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Identify any diseases in this ${cropType} crop image.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ],
            },
          ],
          response_format: { type: "json_object" },
        });
        
        // Process the AI response
        const content = response.choices[0].message.content || '{}';
        const diseaseData = JSON.parse(content);
        
        // Add required fields
        diseaseData.id = `disease-${Date.now()}`;
        diseaseData.parcelId = parcelId;
        diseaseData.timestamp = new Date().toISOString();
        
        return diseaseData;
      } catch (error: any) {
        console.error('Error detecting diseases:', error);
        throw new Error(`Failed to detect diseases: ${error.message}`);
      }
    },
    
    // Soil Analysis Mutations
    analyzeSoil: async (_: any, { 
      parcelId,
      sampleImageBase64,
      sampleData
    }: { 
      parcelId: string;
      sampleImageBase64?: string;
      sampleData?: any;
    }) => {
      try {
        let soilAnalysisData: any = {
          id: `soil-${Date.now()}`,
          parcelId,
          timestamp: new Date().toISOString(),
          recommendations: []
        };
        
        // If we have sample data, use it directly
        if (sampleData) {
          soilAnalysisData = {
            ...soilAnalysisData,
            ...sampleData
          };
        }
        
        // If we have an image, analyze it with AI
        if (sampleImageBase64) {
          const analysisResult = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
            messages: [
              {
                role: "system",
                content: 
                  "You are an agricultural expert specializing in soil analysis. " +
                  "Analyze the provided soil sample image and provide a detailed assessment. " +
                  "Structure your response as detailed JSON with the following fields: " +
                  "ph (float), organicMatter (percentage), nitrogen (float), phosphorus (float), " +
                  "potassium (float), texture (string), drainage (string), " +
                  "and recommendations (array of strings).",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Analyze this soil sample image for parcel ${parcelId}.`
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${sampleImageBase64}`
                    }
                  }
                ],
              },
            ],
            response_format: { type: "json_object" },
          });
          
          // Process the AI response
          const content = analysisResult.choices[0].message.content || '{}';
          const aiSoilData = JSON.parse(content);
          
          // Combine with existing data
          soilAnalysisData = {
            ...soilAnalysisData,
            ...aiSoilData
          };
        }
        
        // Post to REST API to store the analysis
        const apiPayload = {
          parcelId,
          ...soilAnalysisData
        };
        
        await postToApi('/api/crop-health/soil', apiPayload);
        
        return soilAnalysisData;
      } catch (error: any) {
        console.error('Error analyzing soil:', error);
        throw new Error(`Failed to analyze soil: ${error.message}`);
      }
    },
    
    // Yield Prediction Mutations
    predictYield: async (_: any, { 
      parcelId,
      cropType,
      healthStatus,
      environmentalConditions,
      historicalYields
    }: { 
      parcelId: string;
      cropType: string;
      healthStatus: string;
      environmentalConditions?: string;
      historicalYields?: string;
    }) => {
      try {
        // Forward to REST API first
        const apiPayload = {
          parcelId,
          cropType,
          healthStatus,
          environmentalConditions,
          historicalYields
        };
        
        const response = await postToApi('/api/crop-analysis/predict-yield', apiPayload);
        
        // If the REST API was successful and returned a prediction
        if (response.success && response.prediction) {
          // Transform the REST API response to match our GraphQL schema
          return {
            id: `yield-${Date.now()}`,
            parcelId,
            timestamp: new Date().toISOString(),
            cropType,
            predictedYield: {
              value: response.prediction.predictedYield?.value || 0,
              unit: response.prediction.predictedYield?.unit || 'tonnes',
              perHectare: response.prediction.predictedYield?.perHectare || 0
            },
            confidenceInterval: {
              low: response.prediction.confidenceInterval?.low || 0,
              high: response.prediction.confidenceInterval?.high || 0
            },
            confidenceLevel: response.prediction.confidenceLevel || 0.7,
            influencingFactors: (response.prediction.factors || []).map((factor: any) => ({
              name: factor.name,
              impact: factor.impact,
              description: factor.description
            })),
            comparisonToAverage: response.prediction.comparisonToAverage || 0,
            harvestDateEstimate: response.prediction.harvestDateEstimate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            qualityPrediction: {
              overall: response.prediction.qualityPrediction?.overall || 'average',
              size: response.prediction.qualityPrediction?.size || 'medium',
              uniformity: response.prediction.qualityPrediction?.uniformity || 0.7,
              marketGrade: response.prediction.qualityPrediction?.marketGrade || 'Standard'
            },
            marketValueEstimate: {
              perUnit: response.prediction.marketValueEstimate?.perUnit || 0,
              total: response.prediction.marketValueEstimate?.total || 0,
              currency: response.prediction.marketValueEstimate?.currency || 'USD'
            }
          };
        } else {
          // If the REST API failed or didn't return a prediction, call OpenAI directly
          const analysisResult = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
            messages: [
              {
                role: "system",
                content: 
                  "You are an agricultural expert specializing in crop yield prediction. " +
                  "Analyze the provided information and generate a detailed yield prediction. " +
                  "Structure your response as detailed JSON matching the YieldPrediction type.",
              },
              {
                role: "user",
                content: `Predict the yield for ${cropType} with current health status: ${healthStatus}.` +
                       `${environmentalConditions ? ` Environmental conditions: ${environmentalConditions}.` : ''}` +
                       `${historicalYields ? ` Historical yields: ${historicalYields}.` : ''}`
              },
            ],
            response_format: { type: "json_object" },
          });
          
          // Process the AI response
          const content = analysisResult.choices[0].message.content || '{}';
          const yieldData = JSON.parse(content);
          
          // Add required fields
          yieldData.id = `yield-${Date.now()}`;
          yieldData.parcelId = parcelId;
          yieldData.timestamp = new Date().toISOString();
          yieldData.cropType = cropType;
          
          return yieldData;
        }
      } catch (error: any) {
        console.error('Error predicting yield:', error);
        throw new Error(`Failed to predict yield: ${error.message}`);
      }
    },
  },
  
  // Reference resolvers for federation
  CropHealthAnalysis: {
    __resolveReference: async (reference: { id: string }) => {
      const { id } = reference;
      const data = await fetchFromApi(`/api/crop-health/${id}`);
      return mapCropHealthAnalysis(data);
    }
  },
  
  DiseaseDetection: {
    __resolveReference: async (reference: { id: string }) => {
      const { id } = reference;
      const data = await fetchFromApi(`/api/crop-health/diseases/${id}`);
      return data;
    }
  },
  
  SoilAnalysis: {
    __resolveReference: async (reference: { id: string }) => {
      const { id } = reference;
      const data = await fetchFromApi(`/api/crop-health/soil/${id}`);
      return data;
    }
  },
  
  YieldPrediction: {
    __resolveReference: async (reference: { id: string }) => {
      const { id } = reference;
      const data = await fetchFromApi(`/api/crop-health/yield/${id}`);
      return data;
    }
  },
  
  WeatherData: {
    __resolveReference: async (reference: { id: string }) => {
      const { id } = reference;
      const data = await fetchFromApi(`/api/crop-health/weather/${id}`);
      return data;
    }
  }
};