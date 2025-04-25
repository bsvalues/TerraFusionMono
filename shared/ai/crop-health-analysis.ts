import OpenAI from "openai";

// Initialize OpenAI with the API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

// Base interface for crop analysis results
interface CropAnalysisResult {
  cropType: string;
  healthStatus: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
  issues: Array<{
    name: string;
    description: string;
    severity: number;
    recommendedActions: string[];
  }>;
  overallAssessment: string;
  confidenceScore: number;
}

// Extended interface for advanced analysis with additional fields
interface AdvancedCropAnalysisResult extends CropAnalysisResult {
  growthStage: string;
  nutritionalStatus: {
    overall: 'optimal' | 'adequate' | 'deficient' | 'toxic';
    deficiencies: Array<{
      nutrient: string;
      severity: 'mild' | 'moderate' | 'severe';
      symptoms: string[];
      corrections: string[];
    }>;
  };
  estimatedYield: {
    prediction: string;
    optimisticScenario: string;
    pessimisticScenario: string;
    confidenceLevel: number;
  };
  diseaseRisk: {
    currentRisks: Array<{
      diseaseName: string;
      likelihood: number;
      impact: 'low' | 'medium' | 'high';
      preventativeMeasures: string[];
    }>;
  };
  temporalChanges?: {
    comparedToPrevious: string;
    trendAnalysis: string;
    keyChanges: string[];
  };
  regionSpecificInsights?: string[];
}

// Location data structure with additional weather and soil info
interface EnhancedLocationData {
  latitude: number;
  longitude: number;
  elevation?: number;
  region?: string;
  weatherConditions?: {
    temperature?: number;
    humidity?: number;
    rainfall?: number;
    recentRainfall?: string;
  };
  soilProperties?: {
    type?: string;
    ph?: number;
    organicMatter?: number;
  };
}

/**
 * Analyzes crop health from an image using OpenAI
 * @param imageBase64 Base64-encoded image data
 * @param location Optional location data
 * @param previousHistory Optional previous analysis history
 * @returns Analysis results including crop type, health status, and recommendations
 */
export async function analyzeCropHealth(
  imageBase64: string,
  location?: { latitude: number; longitude: number },
  previousHistory?: string
): Promise<CropAnalysisResult> {
  try {
    let systemPrompt = `You are an expert agricultural analyst specializing in crop health assessment. 
    Analyze the provided image and identify:
    1. The crop type
    2. Overall plant health status
    3. Any visible diseases, nutrient deficiencies, pest damage, or environmental stress
    4. Provide actionable recommendations for the farmer
    
    Respond with a detailed JSON analysis in this exact format:
    {
      "cropType": "crop name",
      "healthStatus": "excellent|good|moderate|poor|critical",
      "issues": [
        {
          "name": "issue name",
          "description": "detailed description",
          "severity": 0-10 (scale),
          "recommendedActions": ["action 1", "action 2"]
        }
      ],
      "overallAssessment": "summary of findings",
      "confidenceScore": 0.0-1.0
    }`;

    if (location) {
      systemPrompt += `\n\nImage was taken at location: Latitude ${location.latitude}, Longitude ${location.longitude}. Consider regional crop diseases and growing conditions.`;
    }

    if (previousHistory) {
      systemPrompt += `\n\nPrevious analysis history: ${previousHistory}. Consider trends and changes from previous assessments.`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this crop image and provide a detailed health assessment:"
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

    const result = JSON.parse(response.choices[0].message.content) as CropAnalysisResult;
    return result;
  } catch (error) {
    console.error("Failed to analyze crop health:", error);
    throw new Error(`Crop health analysis failed: ${error.message}`);
  }
}

/**
 * Generates crop care recommendations based on analysis and historical data
 * @param cropType The identified crop type
 * @param healthIssues List of health issues
 * @param historicalData Optional historical data 
 * @returns Customized recommendations
 */
export async function generateCropCareRecommendations(
  cropType: string,
  healthIssues: string[],
  historicalData?: string
): Promise<string[]> {
  try {
    let prompt = `Given a ${cropType} crop with the following health issues: ${healthIssues.join(", ")}, provide specific, sustainable care recommendations.`;
    
    if (historicalData) {
      prompt += ` Historical data shows: ${historicalData}.`;
    }

    prompt += ` Format your response as a JSON array of recommendation strings.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an agricultural extension specialist who provides evidence-based recommendations for crop management. Focus on sustainable, practical solutions that consider resource constraints of small and medium-scale farmers."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const parsedResponse = JSON.parse(response.choices[0].message.content);
    return Array.isArray(parsedResponse) ? parsedResponse : [];
  } catch (error) {
    console.error("Failed to generate crop care recommendations:", error);
    throw new Error(`Recommendation generation failed: ${error.message}`);
  }
}

/**
 * Predicts crop yields based on current health, historical data, and environmental conditions
 * @param cropType The identified crop type
 * @param healthStatus Current health status
 * @param environmentalConditions Optional environmental conditions data
 * @param historicalYields Optional historical yield data
 * @returns Yield prediction and confidence levels
 */
export async function predictCropYield(
  cropType: string,
  healthStatus: string,
  environmentalConditions?: string,
  historicalYields?: string
): Promise<{ prediction: string; confidenceLevel: number; factors: string[] }> {
  try {
    let prompt = `Based on a ${cropType} crop with current health status rated as "${healthStatus}", provide a yield prediction.`;
    
    if (environmentalConditions) {
      prompt += ` Environmental conditions: ${environmentalConditions}.`;
    }
    
    if (historicalYields) {
      prompt += ` Historical yield data: ${historicalYields}.`;
    }
    
    prompt += ` Provide your response as a JSON object with the following structure:
    {
      "prediction": "detailed yield prediction description",
      "confidenceLevel": 0.0-1.0,
      "factors": ["factor 1 affecting yield", "factor 2", ...]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an agricultural data scientist specializing in crop yield forecasting. Provide evidence-based yield predictions considering crop health, growing conditions, and historical performance."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Failed to predict crop yield:", error);
    throw new Error(`Yield prediction failed: ${error.message}`);
  }
}