import Anthropic from '@anthropic-ai/sdk';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Types for analysis results
export interface PropertyPhotoAnalysis {
  description: string;
  propertyType: string;
  visibleFeatures: string[];
  estimatedValue: {
    range: string;
    confidence: number;
    factors: string[];
  };
  condition: {
    rating: number;
    notes: string[];
  };
  recommendations: string[];
}

/**
 * Analyzes a property photograph using Anthropic's Claude model
 * 
 * @param imageBuffer - The buffer containing the image data
 * @returns Object containing analysis results
 */
export async function analyzePropertyPhotoWithAnthropic(
  imageBuffer: Buffer
): Promise<{ 
  success: boolean;
  analysis?: PropertyPhotoAnalysis;
  message?: string;
}> {
  try {
    // Convert buffer to base64 for Anthropic API
    const base64Image = imageBuffer.toString('base64');
    
    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025. Do not change this unless explicitly requested by the user.
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1000,
      system: `You are an expert real estate appraiser with extensive experience in evaluating properties from photographs.
Analyze the provided property image in detail for appraisal purposes.
Format your response as JSON with the following structure:
{
  "description": "Brief objective description of the property",
  "propertyType": "Type of property (single-family, condo, etc.)",
  "visibleFeatures": ["List of visible features that affect valuation"],
  "estimatedValue": {
    "range": "Estimated value range based on visible elements",
    "confidence": number from 0-1 indicating confidence in your estimate,
    "factors": ["Factors that influence your valuation"]
  },
  "condition": {
    "rating": number from 1-10 indicating the property's condition,
    "notes": ["Observations about the property's condition"]
  },
  "recommendations": ["Recommendations for better assessment"]
}
Focus exclusively on what is visible in the image. If something cannot be determined, indicate so.
Your analysis must be factual, objective, and based solely on the photograph.`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this property photograph for an appraisal report.'
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }
      ]
    });

    try {
      // Parse the JSON response
      const contentBlock = response.content[0];
      // Check if the content is of text type
      if ('type' in contentBlock && contentBlock.type === 'text') {
        const analysis = JSON.parse(contentBlock.text);
        
        return {
          success: true,
          analysis
        };
      } else {
        throw new Error('Unexpected response format from Anthropic API');
      }
    } catch (error) {
      // Handle case where response wasn't proper JSON
      return {
        success: false,
        message: 'Failed to parse analysis results',
        analysis: {
          description: 'Analysis failed',
          propertyType: 'Unknown',
          visibleFeatures: [],
          estimatedValue: {
            range: 'Unable to determine',
            confidence: 0,
            factors: []
          },
          condition: {
            rating: 0,
            notes: ['Analysis failed']
          },
          recommendations: ['Try again with a clearer image']
        }
      };
    }
  } catch (error) {
    console.error('Error analyzing photo with Anthropic:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Performs a detailed appraisal property inspection using Anthropic's Claude
 * 
 * @param imageBuffer - The buffer containing the image data
 * @returns Detailed property inspection report
 */
export async function detailedPropertyInspection(
  imageBuffer: Buffer
): Promise<{ 
  success: boolean;
  inspectionReport?: {
    exterior: {
      foundation: string;
      siding: string;
      roof: string;
      windows: string;
      landscaping: string;
      overallCondition: string;
    };
    interior?: {
      flooring: string;
      walls: string;
      ceilings: string;
      fixtures: string;
      overallCondition: string;
    };
    uniqueFeatures: string[];
    defects: string[];
    qualityIndicators: string[];
    maintenanceNeeds: string[];
    appraisalConsiderations: string[];
  };
  message?: string;
}> {
  try {
    // Convert buffer to base64 for Anthropic API
    const base64Image = imageBuffer.toString('base64');
    
    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025. Do not change this unless explicitly requested by the user.
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1500,
      system: `You are an expert real estate inspector with deep experience in property valuation and appraisal.
Provide a detailed inspection report based on the property photograph.
Format your response as JSON with the following structure:
{
  "exterior": {
    "foundation": "Assessment of visible foundation elements",
    "siding": "Description and condition of siding/exterior walls",
    "roof": "Roof type, materials, and visible condition",
    "windows": "Window type, quality, and condition",
    "landscaping": "Assessment of visible landscaping features",
    "overallCondition": "Summary of exterior condition"
  },
  "interior": {
    "flooring": "Visible flooring types and condition",
    "walls": "Wall condition and finish",
    "ceilings": "Ceiling condition and characteristics",
    "fixtures": "Visible fixtures and their condition",
    "overallCondition": "Summary of interior condition"
  },
  "uniqueFeatures": ["List of distinctive property features"],
  "defects": ["Visible issues or defects that impact value"],
  "qualityIndicators": ["Elements that suggest construction quality"],
  "maintenanceNeeds": ["Visible maintenance requirements"],
  "appraisalConsiderations": ["Factors relevant to property valuation"]
}
If the image shows only exterior or only interior, populate only the relevant section.
Be specific about what you can observe and state when something cannot be determined from the available image.`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please provide a detailed property inspection report based on this photograph.'
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }
      ]
    });

    try {
      // Parse the JSON response
      const contentBlock = response.content[0];
      // Check if the content is of text type
      if ('type' in contentBlock && contentBlock.type === 'text') {
        const inspectionReport = JSON.parse(contentBlock.text);
        
        return {
          success: true,
          inspectionReport
        };
      } else {
        throw new Error('Unexpected response format from Anthropic API');
      }
    } catch (error) {
      // Handle case where response wasn't proper JSON
      return {
        success: false,
        message: 'Failed to parse inspection results',
      };
    }
  } catch (error) {
    console.error('Error performing property inspection:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}