import OpenAI from "openai";

// Define AIValuationResponse type locally to avoid circular dependency
export interface AIValuationResponse {
  estimatedValue: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  valueRange: {
    min: number;
    max: number;
  };
  adjustments: Array<{
    factor: string;
    description: string;
    amount: number;
    reasoning: string;
  }>;
  marketAnalysis: string;
  comparableAnalysis: string;
  valuationMethodology: string;
}

// OpenAI client initialization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Property data types
export interface PropertyData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  yearBuilt: number;
  grossLivingArea: number;
  lotSize: number;
  bedrooms: number;
  bathrooms: number;
  features: string[];
  condition: string;
  quality: string;
}

export interface ComparableProperty extends PropertyData {
  salePrice: number;
  saleDate: string;
  distanceFromSubject: number;
}

/**
 * Performs an automated valuation of a subject property based on comparable properties
 * using AI analysis.
 */
export async function performAutomatedValuation(
  subjectProperty: PropertyData,
  comparableProperties: ComparableProperty[]
): Promise<AIValuationResponse> {
  try {
    console.log("Using OpenAI for automated valuation");
    
    // Construct a detailed prompt
    const prompt = `
You are an expert real estate appraiser. You need to analyze a subject property and its comparable sales to determine a market value estimate.

SUBJECT PROPERTY:
Address: ${subjectProperty.address}
City: ${subjectProperty.city}
State: ${subjectProperty.state}
Zip Code: ${subjectProperty.zipCode}
Property Type: ${subjectProperty.propertyType}
Year Built: ${subjectProperty.yearBuilt}
Gross Living Area: ${subjectProperty.grossLivingArea} sq ft
Lot Size: ${subjectProperty.lotSize} sq ft
Bedrooms: ${subjectProperty.bedrooms}
Bathrooms: ${subjectProperty.bathrooms}
Features: ${subjectProperty.features.join(", ")}
Condition: ${subjectProperty.condition}
Quality: ${subjectProperty.quality}

COMPARABLE PROPERTIES:
${comparableProperties.map((comp, index) => `
COMPARABLE #${index + 1}:
Address: ${comp.address}
City: ${comp.city}
State: ${comp.state}
Zip Code: ${comp.zipCode}
Property Type: ${comp.propertyType}
Year Built: ${comp.yearBuilt}
Gross Living Area: ${comp.grossLivingArea} sq ft
Lot Size: ${comp.lotSize} sq ft
Bedrooms: ${comp.bedrooms}
Bathrooms: ${comp.bathrooms}
Features: ${comp.features.join(", ")}
Condition: ${comp.condition}
Quality: ${comp.quality}
Sale Price: $${comp.salePrice}
Sale Date: ${comp.saleDate}
Distance from Subject: ${comp.distanceFromSubject} miles
`).join("")}

Based on the subject property characteristics and comparable sales, please provide the following in JSON format:
1. Estimated value (estimatedValue) - a numeric dollar amount representing the most probable value
2. Confidence level (confidenceLevel) - "high", "medium", or "low" based on the quality and quantity of comparables
3. Value range (valueRange) - a range with minimum and maximum values (min, max) representing a reasonable value range
4. Adjustments (adjustments) - an array of adjustments made to comparables, each with:
   - factor: the characteristic being adjusted (e.g., "GLA", "Age", "Bathrooms")
   - description: a brief description of the factor
   - amount: dollar amount of adjustment (positive if comparable is inferior, negative if superior)
   - reasoning: brief reasoning for the adjustment
5. Market analysis (marketAnalysis) - a brief analysis of the current market conditions
6. Comparable analysis (comparableAnalysis) - a brief analysis of the comparable properties
7. Valuation methodology (valuationMethodology) - a brief description of the methodology used

Your response should be in valid JSON format.
`;

    // Call OpenAI API with GPT-4o model
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an expert real estate appraiser assistant that provides detailed property valuations." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    // Parse the JSON response
    const content = response.choices[0].message.content;
    const result = JSON.parse(typeof content === 'string' ? content : '{}');
    
    // Ensure the response matches our expected format
    const valuation: AIValuationResponse = {
      estimatedValue: result.estimatedValue || 0,
      confidenceLevel: result.confidenceLevel || 'medium',
      valueRange: result.valueRange || { min: 0, max: 0 },
      adjustments: result.adjustments || [],
      marketAnalysis: result.marketAnalysis || '',
      comparableAnalysis: result.comparableAnalysis || '',
      valuationMethodology: result.valuationMethodology || ''
    };
    
    return valuation;
  } catch (error: any) {
    console.error("Error in AI valuation:", error);
    throw new Error(`AI valuation failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Analyzes market trends for a specific location and property type
 */
export async function analyzeMarketTrends(
  location: { city: string; state: string; zipCode: string },
  propertyType: string
): Promise<{ analysis: string }> {
  try {
    console.log("Using OpenAI for market trends analysis");
    
    const prompt = `
You are an expert real estate market analyst. Please provide a detailed market analysis for:
Location: ${location.city}, ${location.state} ${location.zipCode}
Property Type: ${propertyType}

Include the following sections in your analysis:
1. Recent Market Activity (Past 6 Months)
2. Price Trends
3. Days on Market
4. Supply and Demand Factors
5. Forecasted Market Direction

Format your response using Markdown syntax with appropriate headings and bullet points.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an expert real estate market analyst assistant that provides detailed market analyses." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5
    });

    return { analysis: response.choices[0].message.content || '' };
  } catch (error: any) {
    console.error("Error in market trends analysis:", error);
    throw new Error(`Market trends analysis failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Recommends adjustments for a comparable property relative to a subject property
 */
export async function recommendAdjustments(
  subjectProperty: PropertyData,
  comparableProperty: ComparableProperty
): Promise<{ adjustments: any[] }> {
  try {
    console.log("Using OpenAI for adjustment recommendations");
    
    const prompt = `
You are an expert real estate appraiser. Your task is to recommend adjustments for a comparable property relative to a subject property.

SUBJECT PROPERTY:
Address: ${subjectProperty.address}
City: ${subjectProperty.city}
State: ${subjectProperty.state}
Zip Code: ${subjectProperty.zipCode}
Property Type: ${subjectProperty.propertyType}
Year Built: ${subjectProperty.yearBuilt}
Gross Living Area: ${subjectProperty.grossLivingArea} sq ft
Lot Size: ${subjectProperty.lotSize} sq ft
Bedrooms: ${subjectProperty.bedrooms}
Bathrooms: ${subjectProperty.bathrooms}
Features: ${subjectProperty.features.join(", ")}
Condition: ${subjectProperty.condition}
Quality: ${subjectProperty.quality}

COMPARABLE PROPERTY:
Address: ${comparableProperty.address}
City: ${comparableProperty.city}
State: ${comparableProperty.state}
Zip Code: ${comparableProperty.zipCode}
Property Type: ${comparableProperty.propertyType}
Year Built: ${comparableProperty.yearBuilt}
Gross Living Area: ${comparableProperty.grossLivingArea} sq ft
Lot Size: ${comparableProperty.lotSize} sq ft
Bedrooms: ${comparableProperty.bedrooms}
Bathrooms: ${comparableProperty.bathrooms}
Features: ${comparableProperty.features.join(", ")}
Condition: ${comparableProperty.condition}
Quality: ${comparableProperty.quality}
Sale Price: $${comparableProperty.salePrice}
Sale Date: ${comparableProperty.saleDate}
Distance from Subject: ${comparableProperty.distanceFromSubject} miles

Based on the differences between the subject property and the comparable property, recommend adjustments to the comparable's sale price.
Each adjustment should include:
1. Factor: the characteristic being adjusted (e.g., "GLA", "Age", "Bathrooms")
2. Description: a brief description of the factor
3. Amount: dollar amount of adjustment (positive if comparable is inferior, negative if superior)
4. Reasoning: brief reasoning for the adjustment

Provide your response as a JSON array.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an expert real estate appraiser assistant that provides detailed adjustment recommendations." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{"adjustments":[]}');
    return { adjustments: result.adjustments || [] };
  } catch (error: any) {
    console.error("Error in adjustment recommendations:", error);
    throw new Error(`Adjustment recommendations failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Generates a valuation narrative for a property based on valuation results
 */
export async function generateValuationNarrative(
  property: PropertyData,
  valuation: AIValuationResponse
): Promise<{ narrative: string }> {
  try {
    console.log("Using OpenAI for valuation narrative generation");
    
    const prompt = `
You are an expert real estate appraiser. Your task is to generate a professional valuation narrative for the following property:

PROPERTY:
Address: ${property.address}
City: ${property.city}
State: ${property.state}
Zip Code: ${property.zipCode}
Property Type: ${property.propertyType}
Year Built: ${property.yearBuilt}
Gross Living Area: ${property.grossLivingArea} sq ft
Lot Size: ${property.lotSize} sq ft
Bedrooms: ${property.bedrooms}
Bathrooms: ${property.bathrooms}
Features: ${property.features.join(", ")}
Condition: ${property.condition}
Quality: ${property.quality}

VALUATION RESULTS:
Estimated Value: $${valuation.estimatedValue}
Confidence Level: ${valuation.confidenceLevel}
Value Range: $${valuation.valueRange.min} - $${valuation.valueRange.max}
Market Analysis: ${valuation.marketAnalysis}
Comparable Analysis: ${valuation.comparableAnalysis}
Valuation Methodology: ${valuation.valuationMethodology}

Generate a professional, formal valuation narrative that would be suitable for inclusion in an appraisal report. 
The narrative should include:
1. Introduction - brief description of the property and purpose of the valuation
2. Neighborhood Analysis - brief analysis of the neighborhood and its impact on value
3. Property Analysis - description of the property's features and condition
4. Market Analysis - summary of current market conditions
5. Valuation Approach - explanation of the methodology used
6. Comparable Sales Analysis - analysis of the comparable sales used
7. Final Value Opinion - final value opinion with justification

Format your response using Markdown syntax with appropriate headings.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an expert real estate appraiser assistant that provides professional valuation narratives." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    });

    return { narrative: response.choices[0].message.content || '' };
  } catch (error: any) {
    console.error("Error in valuation narrative generation:", error);
    throw new Error(`Valuation narrative generation failed: ${error.message || 'Unknown error'}`);
  }
}