import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Response schemas for structured data
export const PropertyExtractionSchema = z.object({
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  propertyType: z.string(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  squareFeet: z.number().optional(),
  yearBuilt: z.number().optional(),
  lotSize: z.string().optional(),
  stories: z.number().optional(),
  garage: z.string().optional(),
  basement: z.string().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().optional(),
  clientPhone: z.string().optional(),
  lenderName: z.string().optional(),
  loanNumber: z.string().optional(),
  orderDate: z.string().optional(),
  dueDate: z.string().optional(),
  comments: z.string().optional(),
});

export type PropertyExtraction = z.infer<typeof PropertyExtractionSchema>;

export const DocumentAnalysisSchema = z.object({
  documentType: z.string(),
  confidence: z.number(),
  extractedData: z.record(z.string(), z.any()),
  missingFields: z.array(z.string()),
  potentialIssues: z.array(z.object({
    issue: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    description: z.string()
  })),
  recommendations: z.array(z.string())
});

export type DocumentAnalysis = z.infer<typeof DocumentAnalysisSchema>;

// Extract structured property data from text
export async function extractPropertyData(
  text: string
): Promise<PropertyExtraction> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `Extract structured property data from this appraisal order email or document. Return a valid JSON object with all the fields you can find in the document.

${text}`
        }
      ],
      system: `You are an expert real estate data extraction assistant. Extract all property, client, and transaction details into a structured JSON format.
Only return a clean, valid JSON object with the following fields (if available):
{
  "address": "full property address",
  "city": "city name",
  "state": "state abbreviation",
  "zipCode": "zip code",
  "propertyType": "single family, condo, etc.",
  "bedrooms": number of bedrooms,
  "bathrooms": number of bathrooms,
  "squareFeet": square footage as a number,
  "yearBuilt": year built as a number,
  "lotSize": "lot size as text",
  "stories": number of stories,
  "garage": "garage description",
  "basement": "basement description",
  "clientName": "ordering client name",
  "clientEmail": "client email",
  "clientPhone": "client phone",
  "lenderName": "lender name",
  "loanNumber": "loan number", 
  "orderDate": "order date",
  "dueDate": "due date",
  "comments": "any special instructions or comments"
}
Do not include fields you cannot find in the document. Do not include explanations, just return the JSON object.`
    });

    // Parse the response text to JSON
    const content = message.content[0];
    // Check if content has text property
    if (!('text' in content)) {
      throw new Error("Unexpected response format from Anthropic");
    }
    const responseText = content.text;
    const jsonStartIndex = responseText.indexOf('{');
    const jsonEndIndex = responseText.lastIndexOf('}') + 1;
    
    if (jsonStartIndex === -1 || jsonEndIndex === 0) {
      throw new Error("Failed to extract JSON from Anthropic response");
    }
    
    const jsonString = responseText.substring(jsonStartIndex, jsonEndIndex);
    const extractedData = JSON.parse(jsonString);
    
    // Validate the data against our schema
    const validatedData = PropertyExtractionSchema.parse(extractedData);
    return validatedData;
  } catch (error) {
    console.error("Error extracting property data with Anthropic:", error);
    throw error;
  }
}

// Analyze document for compliance and completeness
export async function analyzeDocument(
  documentText: string, 
  documentType: string
): Promise<DocumentAnalysis> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `Analyze this ${documentType} document for quality, compliance, and completeness. Identify any issues, missing information, or potential problems.

${documentText}`
        }
      ],
      system: `You are an expert real estate appraiser and compliance specialist. Analyze appraisal documents for quality, compliance with USPAP standards, and completeness. 
Return your analysis as a JSON object with the following structure:
{
  "documentType": "the type of document analyzed",
  "confidence": a number between 0 and 1 indicating your confidence in the analysis,
  "extractedData": an object containing key data points found in the document,
  "missingFields": an array of important fields that appear to be missing,
  "potentialIssues": an array of objects describing potential issues found, each with:
    {
      "issue": "brief description of the issue",
      "severity": "low", "medium", or "high",
      "description": "detailed explanation of the issue"
    },
  "recommendations": an array of recommendations for improving the document
}
Only return the JSON object with no additional text or explanation.`
    });

    // Parse the response text to JSON
    const content = message.content[0];
    // Check if content has text property
    if (!('text' in content)) {
      throw new Error("Unexpected response format from Anthropic");
    }
    const responseText = content.text;
    const jsonStartIndex = responseText.indexOf('{');
    const jsonEndIndex = responseText.lastIndexOf('}') + 1;
    
    if (jsonStartIndex === -1 || jsonEndIndex === 0) {
      throw new Error("Failed to extract JSON from Anthropic response");
    }
    
    const jsonString = responseText.substring(jsonStartIndex, jsonEndIndex);
    const analysisData = JSON.parse(jsonString);
    
    // Validate the data against our schema
    const validatedData = DocumentAnalysisSchema.parse(analysisData);
    return validatedData;
  } catch (error) {
    console.error("Error analyzing document with Anthropic:", error);
    throw error;
  }
}

// Generate comprehensive property description
export async function generatePropertyDescription(
  propertyData: Partial<PropertyExtraction>,
  additionalDetails?: string
): Promise<string> {
  try {
    // Construct a prompt with the property data
    let propertyPrompt = "Generate a comprehensive property description for this property:\n\n";
    
    Object.entries(propertyData).forEach(([key, value]) => {
      if (value) {
        propertyPrompt += `${key}: ${value}\n`;
      }
    });
    
    if (additionalDetails) {
      propertyPrompt += `\nAdditional details:\n${additionalDetails}`;
    }

    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: propertyPrompt
        }
      ],
      system: `You are an expert real estate appraiser. Generate a comprehensive, professional property description suitable for an appraisal report. 
Include relevant details about the property location, physical characteristics, condition, and notable features. 
Use objective, factual language appropriate for a formal appraisal report.
The description should be 2-3 paragraphs long and well-organized.`
    });

    const content = message.content[0];
    // Check if content has text property
    if (!('text' in content)) {
      throw new Error("Unexpected response format from Anthropic");
    }
    return content.text;
  } catch (error) {
    console.error("Error generating property description with Anthropic:", error);
    throw error;
  }
}

// Analyze market conditions
export async function analyzeMarketConditions(
  location: string, 
  propertyType: string
): Promise<string> {
  try {
    const prompt = `Analyze current market conditions for ${propertyType} properties in ${location}. Include trends in:
- Supply and demand
- Days on market
- Price trends
- Inventory levels
- New construction impact
- Local economic factors`;

    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      system: `You are an expert real estate market analyst. Generate a factual, comprehensive market conditions analysis suitable for an appraisal report.
The analysis should be objective and data-focused, avoiding promotional language.
Structure your response in 2-3 concise paragraphs that address supply/demand dynamics, price trends, inventory levels, and other relevant market factors.
Your analysis should help establish the market context for the property being appraised.`
    });

    const content = message.content[0];
    // Check if content has text property
    if (!('text' in content)) {
      throw new Error("Unexpected response format from Anthropic");
    }
    return content.text;
  } catch (error) {
    console.error("Error analyzing market conditions with Anthropic:", error);
    throw error;
  }
}

// Compare subject property to comparable properties
export async function analyzeComparables(
  subjectProperty: Partial<PropertyExtraction>,
  comparableProperties: Array<Partial<PropertyExtraction>>
): Promise<string> {
  try {
    // Format subject property
    let prompt = "Subject property:\n";
    Object.entries(subjectProperty).forEach(([key, value]) => {
      if (value) {
        prompt += `${key}: ${value}\n`;
      }
    });
    
    // Format comparable properties
    prompt += "\nComparable properties:\n";
    comparableProperties.forEach((comp, index) => {
      prompt += `\nComparable #${index + 1}:\n`;
      Object.entries(comp).forEach(([key, value]) => {
        if (value) {
          prompt += `${key}: ${value}\n`;
        }
      });
    });
    
    prompt += "\nPlease analyze these comparable properties in relation to the subject property. Identify strengths and weaknesses of each comparable and explain how they compare to the subject property.";

    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      system: `You are an expert real estate appraiser. Analyze comparable properties in relation to a subject property for an appraisal report.
Focus on key factors that influence value: location, size, condition, age, amenities, and other relevant characteristics.
Identify strengths and weaknesses of each comparable.
Your analysis should be objective, factual, and suitable for inclusion in a formal appraisal report.
Structure your response as a cohesive narrative that evaluates the comparability of each property.`
    });

    const content = message.content[0];
    // Check if content has text property
    if (!('text' in content)) {
      throw new Error("Unexpected response format from Anthropic");
    }
    return content.text;
  } catch (error) {
    console.error("Error analyzing comparables with Anthropic:", error);
    throw error;
  }
}