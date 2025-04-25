/**
 * Shared AI utilities for crop health analysis
 * This module provides functions for analyzing crop images using OpenAI's models.
 */
import OpenAI from 'openai';

/**
 * Analyzes crop images to determine health status, growth stage, and issues
 * 
 * @param openai OpenAI client instance
 * @param imageBase64 Base64-encoded image data
 * @param cropType Known crop type (if identified)
 * @returns Analysis results with health metrics and issues
 */
export async function analyzeImages(
  openai: OpenAI,
  imageBase64: string,
  cropType: string
): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: 
            "You are an agricultural expert specializing in crop health analysis. " +
            "Analyze the provided crop image and provide a detailed assessment of the crop's health. " +
            "Structure your response as detailed JSON with the following fields: " +
            "healthStatus (string: excellent, good, moderate, poor, critical), " +
            "healthScore (integer: 0-100), " +
            "developmentStage (string), " +
            "issues (array of objects containing name, description, severity, affectedArea, and recommendedActions), " +
            "spatialDistribution (string), " +
            "temporalTrends (string), " +
            "and confidenceScore (0-1).",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze the health of this ${cropType} crop.`
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
    
    // Extract the response content
    const analysisJson = response.choices[0].message.content || '{}';
    return JSON.parse(analysisJson);
  } catch (error: any) {
    console.error('Error analyzing crop images:', error);
    throw new Error(`Failed to analyze crop images: ${error.message}`);
  }
}

/**
 * Performs advanced analysis of crop images with additional contextual information
 * 
 * @param openai OpenAI client instance
 * @param imagesBase64 Array of base64-encoded image data
 * @param cropType Known crop type (if identified)
 * @param location Geographic location information
 * @param soilType Soil type information if available
 * @param weather Weather conditions if available
 * @param plantingDate When the crop was planted if known
 * @param previousIssues Any known previous issues with this crop
 * @returns Comprehensive analysis with health metrics, spatial mapping, and recommendations
 */
export async function advancedAnalyze(
  openai: OpenAI,
  imagesBase64: string[],
  cropType: string,
  location?: string,
  soilType?: string,
  weather?: string,
  plantingDate?: string,
  previousIssues?: string
): Promise<any> {
  try {
    // Construct a contextual prompt with the additional information
    let contextPrompt = `Analyze the health of this ${cropType} crop.`;
    if (location) contextPrompt += ` Location: ${location}.`;
    if (soilType) contextPrompt += ` Soil type: ${soilType}.`;
    if (weather) contextPrompt += ` Weather conditions: ${weather}.`;
    if (plantingDate) contextPrompt += ` Planted on: ${plantingDate}.`;
    if (previousIssues) contextPrompt += ` Previous issues: ${previousIssues}.`;
    
    // Prepare the message content with all images
    const content: any[] = [
      {
        type: "text",
        text: contextPrompt
      }
    ];
    
    // Add all images to the message content
    imagesBase64.forEach((base64, index) => {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${base64}`
        }
      });
      
      // Add separators for multiple images
      if (index < imagesBase64.length - 1) {
        content.push({
          type: "text",
          text: `Image ${index + 1} above. Analyzing next image (${index + 2}):`
        });
      }
    });
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: 
            "You are an agricultural expert specializing in advanced crop health analysis. " +
            "Analyze the provided crop images and contextual information to provide a comprehensive assessment. " +
            "You will receive multiple images of the same crop field from different angles or timestamps. " +
            "Structure your response as detailed JSON with the following fields: " +
            "healthStatus (string: excellent, good, moderate, poor, critical), " +
            "healthScore (integer: 0-100), " +
            "developmentStage (string), " +
            "issues (array of objects containing name, description, severity, affectedArea, patterns, and recommendedActions), " +
            "spatialDistribution (string describing how issues are distributed across the field), " +
            "temporalTrends (string describing how conditions have changed over time if multiple timestamps), " +
            "growthProjection (string), " +
            "yieldImpact (object with percentage and description), " +
            "priorityActions (array of strings), " +
            "and confidenceScore (0-1).",
        },
        {
          role: "user",
          content
        },
      ],
      response_format: { type: "json_object" },
    });
    
    // Extract the response content
    const analysisJson = response.choices[0].message.content || '{}';
    return JSON.parse(analysisJson);
  } catch (error: any) {
    console.error('Error performing advanced crop analysis:', error);
    throw new Error(`Failed to perform advanced crop analysis: ${error.message}`);
  }
}

/**
 * Generates specific recommendations based on analysis results
 * 
 * @param openai OpenAI client instance
 * @param analysis Previous analysis results
 * @param cropType Type of crop
 * @param goals User's specific goals (e.g., maximize yield, organic methods)
 * @returns Detailed recommendations tailored to the analysis and goals
 */
export async function generateRecommendations(
  openai: OpenAI,
  analysis: any,
  cropType: string,
  goals?: string
): Promise<any> {
  try {
    // Convert the analysis object to a formatted string
    const analysisStr = JSON.stringify(analysis, null, 2);
    
    let goalPrompt = '';
    if (goals) {
      goalPrompt = ` The farmer's goals are: ${goals}.`;
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: 
            "You are an agricultural expert specializing in providing actionable recommendations for farmers. " +
            "Based on the crop health analysis provided, generate detailed, prioritized recommendations for immediate action. " +
            "Structure your response as detailed JSON with the following fields: " +
            "urgentActions (array of high-priority actions needed immediately), " +
            "shortTermActions (array of actions needed in days/weeks), " +
            "longTermStrategies (array of actions for future seasons), " +
            "resourceRequirements (equipment, inputs, labor needed), " +
            "expectedOutcomes (what should improve), " +
            "monitoringPlan (what to watch for), " +
            "alternativeApproaches (other options if primary recommendations can't be implemented).",
        },
        {
          role: "user",
          content: `Based on this analysis of a ${cropType} crop:
${analysisStr}
${goalPrompt}
Generate detailed, actionable recommendations for the farmer.`
        },
      ],
      response_format: { type: "json_object" },
    });
    
    // Extract the response content
    const recommendationsJson = response.choices[0].message.content || '{}';
    return JSON.parse(recommendationsJson);
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    throw new Error(`Failed to generate recommendations: ${error.message}`);
  }
}