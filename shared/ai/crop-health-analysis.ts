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
export interface AdvancedCropAnalysisResult extends CropAnalysisResult {
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
export interface EnhancedLocationData {
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

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response content received from OpenAI');
    }
    
    const result = JSON.parse(content) as CropAnalysisResult;
    return result;
  } catch (error: unknown) {
    console.error("Failed to analyze crop health:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Crop health analysis failed: ${errorMessage}`);
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

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response content received from OpenAI');
    }
    
    const parsedResponse = JSON.parse(content);
    return Array.isArray(parsedResponse) ? parsedResponse : [];
  } catch (error: unknown) {
    console.error("Failed to generate crop care recommendations:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Recommendation generation failed: ${errorMessage}`);
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

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response content received from OpenAI');
    }
    
    return JSON.parse(content);
  } catch (error: unknown) {
    console.error("Failed to predict crop yield:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Yield prediction failed: ${errorMessage}`);
  }
}

/**
 * Performs advanced analysis of crop health using multiple images and context data
 * @param images Array of base64-encoded images 
 * @param cropType Known crop type (if available)
 * @param locationData Enhanced location data with weather and soil info
 * @param previousAnalysis Previous analysis results for temporal comparison
 * @returns Advanced analysis with nutritional status, disease risk, and temporal insights
 */
export async function performAdvancedCropAnalysis(
  images: string[],
  cropType?: string,
  locationData?: EnhancedLocationData,
  previousAnalysis?: AdvancedCropAnalysisResult
): Promise<AdvancedCropAnalysisResult> {
  try {
    if (!images || images.length === 0) {
      throw new Error("At least one image is required for analysis");
    }

    // Build system prompt with comprehensive instructions
    let systemPrompt = `You are an elite agricultural scientist specializing in crop health assessment and precision agriculture.
    
    Analyze the provided crop images comprehensively and provide a detailed assessment covering:

    1. Crop identification (if not provided) and growth stage determination
    2. Overall health status evaluation
    3. Detection of visible diseases, pests, or environmental stressors
    4. Nutritional assessment - identify any deficiencies or toxicities
    5. Yield estimation factors - how current conditions may affect final crop yield
    6. Region-specific analysis based on location data (if provided)
    7. Temporal analysis comparing to previous assessment (if provided)
    
    Use your extensive knowledge of crop physiology, pathology, and regional agricultural practices.`;
    
    // Add context data to prompt if available
    if (cropType) {
      systemPrompt += `\n\nThe crop type has been identified as: ${cropType}. Focus your analysis on specific issues common to this crop.`;
    }

    if (locationData) {
      systemPrompt += `\n\nImage was taken at: Latitude ${locationData.latitude}, Longitude ${locationData.longitude}`;
      
      if (locationData.elevation) {
        systemPrompt += `, Elevation: ${locationData.elevation}m`;
      }
      
      if (locationData.region) {
        systemPrompt += `, Region: ${locationData.region}`;
      }
      
      if (locationData.weatherConditions) {
        systemPrompt += `\n\nWeather conditions: `;
        const weather = locationData.weatherConditions;
        
        if (weather.temperature !== undefined) {
          systemPrompt += `Temperature: ${weather.temperature}°C, `;
        }
        
        if (weather.humidity !== undefined) {
          systemPrompt += `Humidity: ${weather.humidity}%, `;
        }
        
        if (weather.rainfall !== undefined) {
          systemPrompt += `Recent rainfall: ${weather.rainfall}mm, `;
        }
        
        if (weather.recentRainfall) {
          systemPrompt += `Rainfall pattern: ${weather.recentRainfall}, `;
        }
      }
      
      if (locationData.soilProperties) {
        systemPrompt += `\n\nSoil properties: `;
        const soil = locationData.soilProperties;
        
        if (soil.type) {
          systemPrompt += `Type: ${soil.type}, `;
        }
        
        if (soil.ph !== undefined) {
          systemPrompt += `pH: ${soil.ph}, `;
        }
        
        if (soil.organicMatter !== undefined) {
          systemPrompt += `Organic matter: ${soil.organicMatter}%, `;
        }
      }
    }

    if (previousAnalysis) {
      systemPrompt += `\n\nPrevious analysis results: ${JSON.stringify(previousAnalysis)}
      
      Compare the current state with previous analysis and note significant changes, improvements, or deteriorations.`;
    }

    // Specify the response format
    systemPrompt += `\n\nProvide your analysis in the following JSON format:
    {
      "cropType": "specific crop name",
      "healthStatus": "excellent|good|moderate|poor|critical",
      "issues": [
        {
          "name": "specific issue name",
          "description": "detailed description",
          "severity": 0-10 (scale),
          "recommendedActions": ["action 1", "action 2"]
        }
      ],
      "overallAssessment": "comprehensive summary of findings",
      "confidenceScore": 0.0-1.0,
      "growthStage": "specific growth stage",
      "nutritionalStatus": {
        "overall": "optimal|adequate|deficient|toxic",
        "deficiencies": [
          {
            "nutrient": "specific nutrient",
            "severity": "mild|moderate|severe",
            "symptoms": ["symptom 1", "symptom 2"],
            "corrections": ["correction 1", "correction 2"]
          }
        ]
      },
      "estimatedYield": {
        "prediction": "yield prediction",
        "optimisticScenario": "best case scenario",
        "pessimisticScenario": "worst case scenario",
        "confidenceLevel": 0.0-1.0
      },
      "diseaseRisk": {
        "currentRisks": [
          {
            "diseaseName": "disease name",
            "likelihood": 0.0-1.0,
            "impact": "low|medium|high",
            "preventativeMeasures": ["measure 1", "measure 2"]
          }
        ]
      }
    }`;

    if (previousAnalysis) {
      systemPrompt += `,
      "temporalChanges": {
        "comparedToPrevious": "comparative assessment",
        "trendAnalysis": "trend direction and significance",
        "keyChanges": ["change 1", "change 2"]
      }`;
    }

    if (locationData?.region) {
      systemPrompt += `,
      "regionSpecificInsights": ["insight 1", "insight 2"]`;
    }

    systemPrompt += `\n}`;

    // Prepare the content array with multiple images
    const contentArray: any[] = [
      {
        type: "text",
        text: "Please analyze these crop images and provide a comprehensive health assessment:"
      }
    ];

    // Add images to content array
    images.forEach((imageBase64, index) => {
      contentArray.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`
        }
      });
    });

    // Make the API call with multiple images
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: contentArray
        }
      ],
      response_format: { type: "json_object" },
    });

    // Parse and return the result
    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No response content received from OpenAI');
    }
    
    const result = JSON.parse(responseContent) as AdvancedCropAnalysisResult;
    return result;
  } catch (error: unknown) {
    console.error("Failed to perform advanced crop analysis:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Advanced crop analysis failed: ${errorMessage}`);
  }
}