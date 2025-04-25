/**
 * This module provides fallback responses for when the OpenAI API is unavailable
 * or has quota limitations. These fallbacks allow the application to continue
 * functioning with basic capabilities.
 */

import type { CropAnalysisResult, AdvancedCropAnalysisResult } from './crop-health-analysis';

/**
 * Provides a basic fallback for crop health analysis when OpenAI is unavailable
 * @param imageInfo Any information about the image that can be used to customize the fallback
 * @returns A simple crop analysis result
 */
export function getFallbackCropAnalysis(imageInfo?: { 
  cropType?: string,
  parcelId?: string
}): CropAnalysisResult {
  // Use provided crop type or default to "unknown"
  const cropType = imageInfo?.cropType || "unknown";
  
  return {
    cropType,
    healthStatus: "moderate",
    issues: [
      {
        name: "Analysis unavailable",
        description: "The AI-powered analysis is temporarily unavailable. Please try again later.",
        severity: 5,
        recommendedActions: [
          "Retry the analysis later when the AI service is available",
          "Perform visual inspection of the crops",
          "Check for common issues manually"
        ]
      }
    ],
    overallAssessment: "Analysis is currently unavailable due to AI service limitations. The system is using a fallback response.",
    confidenceScore: 0.1 // Low confidence since this is a fallback
  };
}

/**
 * Provides a basic fallback for advanced crop analysis when OpenAI is unavailable
 * @param imageInfo Any information about the images that can be used to customize the fallback
 * @returns A simple advanced crop analysis result
 */
export function getFallbackAdvancedAnalysis(imageInfo?: { 
  cropType?: string,
  location?: { region?: string }
}): AdvancedCropAnalysisResult {
  // Use provided crop type or default to "unknown"
  const cropType = imageInfo?.cropType || "unknown";
  const region = imageInfo?.location?.region || "unknown region";
  
  return {
    cropType,
    healthStatus: "moderate",
    issues: [
      {
        name: "Advanced analysis unavailable",
        description: "The AI-powered advanced analysis is temporarily unavailable. Please try again later.",
        severity: 5,
        recommendedActions: [
          "Retry the analysis later when the AI service is available",
          "Consult with an agronomist for professional assessment",
          "Check field records for historical patterns"
        ]
      }
    ],
    overallAssessment: "Advanced analysis is currently unavailable due to AI service limitations. The system is using a fallback response.",
    confidenceScore: 0.1, // Low confidence since this is a fallback
    growthStage: "unknown",
    nutritionalStatus: {
      overall: "adequate",
      deficiencies: [
        {
          nutrient: "unknown",
          severity: "mild",
          symptoms: ["Cannot detect specific deficiencies with fallback system"],
          corrections: ["Conduct soil testing", "Consult with agronomist"]
        }
      ]
    },
    estimatedYield: {
      prediction: "Unable to predict yield with fallback system",
      optimisticScenario: "Yield prediction requires AI analysis",
      pessimisticScenario: "Yield prediction requires AI analysis",
      confidenceLevel: 0
    },
    diseaseRisk: {
      currentRisks: [
        {
          diseaseName: "unknown",
          likelihood: 0,
          impact: "medium",
          preventativeMeasures: [
            "Regular field scouting",
            "Follow standard crop protection practices"
          ]
        }
      ]
    },
    regionSpecificInsights: [
      `Standard growing practices for ${cropType} in ${region} apply`
    ]
  };
}

/**
 * Provides fallback crop care recommendations when OpenAI is unavailable
 * @param cropType The type of crop
 * @param issues List of issues to address
 * @returns Basic recommendations for the specified crop and issues
 */
export function getFallbackRecommendations(
  cropType: string,
  issues: string[]
): string[] {
  // Basic recommendations that apply to most crops
  const generalRecommendations = [
    "Monitor crop regularly for signs of stress or disease",
    "Ensure adequate irrigation based on crop needs and weather conditions",
    "Consider soil testing to identify specific nutrient deficiencies",
    "Follow integrated pest management practices to minimize chemical usage",
    "Maintain detailed records of all treatments and crop responses"
  ];
  
  // Add issue-specific recommendations if available
  const issueRecommendations: Record<string, string[]> = {
    "nitrogen deficiency": [
      "Apply nitrogen-rich fertilizer following recommended rates",
      "Consider split applications to reduce leaching",
      "Implement cover crops in rotation to improve soil nitrogen"
    ],
    "phosphorus deficiency": [
      "Apply phosphate fertilizers to deficient soils",
      "Ensure soil pH is appropriate for phosphorus availability",
      "Consider banded application near root zone for efficient uptake"
    ],
    "potassium deficiency": [
      "Apply potassium-rich fertilizers based on soil test results",
      "Monitor plants for leaf edge browning, a common potassium deficiency symptom",
      "Ensure adequate irrigation as drought stress can worsen potassium deficiency"
    ],
    "leaf spots": [
      "Identify specific pathogen through laboratory testing if possible",
      "Apply appropriate fungicide if disease is confirmed",
      "Improve air circulation by adjusting plant spacing",
      "Avoid overhead irrigation to minimize leaf wetness"
    ],
    "pest damage": [
      "Identify specific pests through field scouting",
      "Implement biological controls when possible",
      "Apply targeted pesticides only when economic thresholds are reached",
      "Rotate pesticide classes to prevent resistance development"
    ],
    "drought stress": [
      "Optimize irrigation scheduling and amounts",
      "Consider mulching to conserve soil moisture",
      "Evaluate drought-tolerant varieties for future plantings"
    ],
    "heat stress": [
      "Ensure adequate irrigation during high temperature periods",
      "Consider shade cloth for sensitive crops when extreme heat is forecasted",
      "Adjust planting dates to avoid peak heat periods in future seasons"
    ]
  };
  
  // Combine general recommendations with any matching issue-specific ones
  let recommendations = [...generalRecommendations];
  
  // Add any issue-specific recommendations that match
  for (const issue of issues) {
    const issueLower = issue.toLowerCase();
    
    // Check if we have specific recommendations for this issue
    for (const [key, value] of Object.entries(issueRecommendations)) {
      if (issueLower.includes(key)) {
        recommendations = [...recommendations, ...value];
        break;
      }
    }
  }
  
  // Add any crop-specific general recommendations
  const cropSpecificRecommendations: Record<string, string[]> = {
    "corn": [
      "Monitor for corn earworm and European corn borer during silking",
      "Ensure sufficient nitrogen during V8-V12 growth stages",
      "Consider soil temperature before planting (minimum 50°F)"
    ],
    "wheat": [
      "Scout for rust and powdery mildew regularly",
      "Apply growth regulators if lodging is a concern",
      "Monitor for Hessian fly in fall-planted wheat"
    ],
    "soybean": [
      "Monitor for soybean cyst nematode",
      "Scout for aphids during R1-R5 growth stages",
      "Consider inoculation with rhizobia before planting"
    ],
    "rice": [
      "Maintain appropriate flood water depth",
      "Monitor for rice blast and sheath blight",
      "Manage water to suppress weeds"
    ],
    "cotton": [
      "Monitor for boll weevil and bollworm",
      "Consider growth regulators to manage plant height",
      "Defoliate at appropriate time before harvest"
    ]
  };
  
  // Add crop-specific recommendations if available
  const cropTypeLower = cropType.toLowerCase();
  for (const [key, value] of Object.entries(cropSpecificRecommendations)) {
    if (cropTypeLower.includes(key)) {
      recommendations = [...recommendations, ...value];
      break;
    }
  }
  
  // Limit to reasonable number of recommendations
  return recommendations.slice(0, 10);
}

/**
 * Provides fallback yield prediction when OpenAI is unavailable
 * @param cropType The type of crop
 * @param healthStatus Current health status
 * @returns Basic yield prediction response
 */
export function getFallbackYieldPrediction(
  cropType: string,
  healthStatus: string
): { prediction: string; confidenceLevel: number; factors: string[] } {
  // Basic yield prediction factors
  const factors = [
    "Current crop health status",
    "Historical yield data for the region",
    "Weather conditions during growing season",
    "Soil fertility and management practices",
    "Pest and disease pressure"
  ];
  
  // Adjust prediction based on health status
  let predictionText = "Unable to provide a precise yield prediction without AI analysis.";
  let confidenceLevel = 0.3; // Low confidence for fallback
  
  switch (healthStatus.toLowerCase()) {
    case "excellent":
      predictionText = `Based on the excellent health status, ${cropType} yields are likely to be above average. However, final yields will depend on weather conditions through harvest.`;
      confidenceLevel = 0.5;
      break;
    case "good":
      predictionText = `With good crop health, ${cropType} yields are expected to be near average. Continue monitoring for any late-season issues.`;
      confidenceLevel = 0.5;
      break;
    case "moderate":
      predictionText = `Current moderate health status suggests ${cropType} yields may be slightly below average. Addressing any identified issues promptly may help improve final yields.`;
      confidenceLevel = 0.4;
      break;
    case "poor":
      predictionText = `Poor crop health indicates ${cropType} yields will likely be significantly below average. Consider interventions immediately if economically viable.`;
      confidenceLevel = 0.5;
      break;
    case "critical":
      predictionText = `Critical crop health status suggests very low yield potential for ${cropType}. Evaluate whether recovery interventions are economically justified.`;
      confidenceLevel = 0.5;
      break;
    default:
      // Keep default prediction text
  }
  
  return {
    prediction: predictionText,
    confidenceLevel,
    factors
  };
}