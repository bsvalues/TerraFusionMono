import OpenAI from 'openai';

/**
 * Analyzes a single crop image to determine health status
 * @param openai OpenAI client instance
 * @param base64Image Base64 encoded image
 * @param cropType Type of crop in the image
 * @param location Optional location information
 * @returns Analysis results including health score, issues, and recommendations
 */
export async function analyzeImages(
  openai: OpenAI, 
  base64Image: string, 
  cropType: string, 
  location?: string
) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: 
          "You are an agricultural expert specializing in crop health analysis. " +
          "Analyze the provided crop image and provide a detailed assessment. " +
          "Focus on identifying health issues, diseases, pest damage, nutrient deficiencies, and other problems. " +
          "Structure your response as detailed JSON with the following fields: " +
          "healthScore (0-100), issues (array of strings), recommendations (array of strings), " +
          "developmentStage (string), confidenceScore (0-1), detectedSpecies (string), " +
          "and any additional relevant information.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this ${cropType} crop image${location ? ` from ${location}` : ''}. Identify any health issues, diseases, or deficiencies.`
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ],
      },
    ],
    response_format: { type: "json_object" },
  });

  // Handle null content (unlikely but possible)
  const content = response.choices[0].message.content || '{}';
  return JSON.parse(content);
}

/**
 * Performs advanced crop analysis using multiple images and additional context
 * @param openai OpenAI client instance
 * @param base64Images Array of base64 encoded images
 * @param cropType Type of crop in the images
 * @param location Optional location information
 * @param soilType Optional soil type information
 * @param weather Optional weather conditions
 * @param plantingDate Optional planting date
 * @param previousIssues Optional information about previous issues
 * @returns Comprehensive analysis results
 */
export async function advancedAnalyze(
  openai: OpenAI,
  base64Images: string[],
  cropType: string,
  location?: string,
  soilType?: string,
  weather?: string,
  plantingDate?: string,
  previousIssues?: string
) {
  // Construct the messages array with all images
  const messages: any[] = [
    {
      role: "system",
      content: 
        "You are an agricultural expert specializing in comprehensive crop health analysis. " +
        "Analyze the provided crop images and additional context to provide a detailed assessment. " +
        "Consider spatial patterns, temporal trends, and environmental factors in your analysis. " +
        "Structure your response as detailed JSON with the following fields: " +
        "healthScore (0-100), issues (array of strings), recommendations (array of strings), " +
        "developmentStage (string), confidenceScore (0-1), detectedSpecies (string), " +
        "spatialAnalysis (object), temporalTrends (object), environmentalFactors (object), " +
        "and any additional relevant information.",
    }
  ];

  // Construct the user message with text and images
  let userContent: any[] = [
    {
      type: "text",
      text: `Perform a comprehensive analysis of these ${cropType} crop images` +
            `${location ? ` from ${location}` : ''}.` +
            `${soilType ? ` Soil type: ${soilType}.` : ''}` +
            `${weather ? ` Weather conditions: ${weather}.` : ''}` +
            `${plantingDate ? ` Planting date: ${plantingDate}.` : ''}` +
            `${previousIssues ? ` Previous issues: ${previousIssues}.` : ''}`
    }
  ];

  // Add the images to the user message
  for (const base64Image of base64Images) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${base64Image}`
      }
    });
  }

  // Add the user message to the messages array
  messages.push({
    role: "user",
    content: userContent
  });

  // Call the OpenAI API for advanced analysis
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: messages,
    response_format: { type: "json_object" },
  });

  // Handle null content (unlikely but possible)
  const content = response.choices[0].message.content || '{}';
  return JSON.parse(content);
}

/**
 * Generates recommendations based on identified crop issues
 * @param openai OpenAI client instance
 * @param cropType Type of crop
 * @param issues Identified issues
 * @param severity Optional severity of issues
 * @param growthStage Optional growth stage of the crop
 * @returns Detailed recommendations
 */
export async function generateRecommendations(
  openai: OpenAI,
  cropType: string,
  issues: string,
  severity?: string,
  growthStage?: string
) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: 
          "You are an agricultural expert specializing in crop management and remediation strategies. " +
          "Based on the identified issues, provide detailed recommendations. " +
          "Structure your response as JSON with the following fields: " +
          "immediateActions (array of strings), preventativeMeasures (array of strings), " +
          "longTermStrategies (array of strings), additionalResources (array of strings), " +
          "and confidenceScore (0-1).",
      },
      {
        role: "user",
        content: `Generate recommendations for ${cropType} with the following issues: ${issues}.` +
                `${severity ? ` Severity: ${severity}.` : ''}` +
                `${growthStage ? ` Growth stage: ${growthStage}.` : ''}`
      },
    ],
    response_format: { type: "json_object" },
  });

  // Handle null content (unlikely but possible)
  const content = response.choices[0].message.content || '{}';
  return JSON.parse(content);
}