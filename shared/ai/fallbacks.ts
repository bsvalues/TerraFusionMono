/**
 * Fallback data providers for when the AI services are unavailable
 * These functions provide alternative responses when OpenAI API calls fail
 */

// Basic crop analysis fallback
export function getBasicAnalysisFallback(cropType: string) {
  const cropTypeFormatted = cropType.toLowerCase();
  let healthScore = 0;
  let issues = [];
  let recommendations = [];
  
  // Determine fallback data based on crop type
  switch (cropTypeFormatted) {
    case 'corn':
    case 'maize':
      healthScore = 75;
      issues = [
        'Mild nutrient deficiency detected',
        'Early signs of leaf yellowing',
        'Some moisture stress visible'
      ];
      recommendations = [
        'Consider applying balanced NPK fertilizer',
        'Monitor soil moisture levels',
        'Check for common corn pests such as corn borer'
      ];
      break;
      
    case 'wheat':
      healthScore = 80;
      issues = [
        'Minor signs of fungal infection',
        'Some leaf discoloration observed'
      ];
      recommendations = [
        'Monitor for progression of fungal symptoms',
        'Consider preventative fungicide if conditions favor disease'
      ];
      break;
      
    case 'soybean':
      healthScore = 70;
      issues = [
        'Leaf spots detected',
        'Minor insect damage',
        'Some yellowing between leaf veins'
      ];
      recommendations = [
        'Scout fields regularly for insect pressure',
        'Consider manganese supplement if interveinal yellowing continues'
      ];
      break;
    
    case 'rice':
      healthScore = 85;
      issues = [
        'Minor signs of water stress',
        'Some leaf tips showing browning'
      ];
      recommendations = [
        'Maintain optimal water levels',
        'Monitor nitrogen levels in paddy'
      ];
      break;
      
    default:
      healthScore = 75;
      issues = [
        'General stress indicators detected',
        'Some discoloration observed'
      ];
      recommendations = [
        'Monitor crop development closely',
        'Consider soil testing to check for nutrient deficiencies',
        'Keep detailed records of any changes in symptoms'
      ];
  }
  
  return {
    healthScore,
    issues,
    recommendations,
    developmentStage: 'Vegetative growth',
    confidenceScore: 0.6, // Lower confidence for fallback data
    detectedSpecies: cropType,
    timestamp: new Date().toISOString()
  };
}

// Advanced analysis fallback
export function getAdvancedAnalysisFallback(cropType: string) {
  const basicFallback = getBasicAnalysisFallback(cropType);
  
  return {
    ...basicFallback,
    spatialAnalysis: {
      affectedAreas: 'Scattered throughout the field with some concentration in low-lying areas',
      distributionPattern: 'Patchy',
      severityMap: 'Generally uniform stress levels across visible areas'
    },
    temporalTrends: {
      progressionRate: 'Slow',
      estimatedOnset: '7-10 days ago',
      projectedDevelopment: 'Likely to remain stable if conditions don\'t change significantly'
    },
    environmentalFactors: {
      soilConditionImpact: 'Moderate',
      weatherContribution: 'Recent weather patterns may be contributing to observed symptoms',
      recommendedMonitoring: 'Check soil moisture levels regularly; monitor temperature extremes'
    },
    confidenceScore: 0.5 // Even lower confidence for advanced fallback
  };
}

// Recommendations fallback
export function getRecommendationsFallback(cropType: string, issues: string) {
  const cropTypeFormatted = cropType.toLowerCase();
  let immediateActions = [];
  let preventativeMeasures = [];
  let longTermStrategies = [];
  
  // Common fallback recommendations
  const commonImmediate = [
    'Document current conditions with photos for comparison',
    'Take soil samples for analysis',
    'Check irrigation system for proper function'
  ];
  
  const commonPreventative = [
    'Implement crop rotation plan',
    'Consider resistant varieties for next planting',
    'Develop a comprehensive nutrient management plan'
  ];
  
  const commonLongTerm = [
    'Improve soil health through organic matter additions',
    'Invest in precision agriculture tools for better monitoring',
    'Develop integrated pest management strategy'
  ];
  
  // Add crop-specific recommendations
  switch (cropTypeFormatted) {
    case 'corn':
    case 'maize':
      immediateActions = [
        ...commonImmediate,
        'Check for corn earworm and European corn borer',
        'Monitor nitrogen levels'
      ];
      preventativeMeasures = [
        ...commonPreventative,
        'Consider Bt varieties for pest resistance'
      ];
      break;
      
    case 'wheat':
      immediateActions = [
        ...commonImmediate,
        'Check for rust or powdery mildew symptoms',
        'Evaluate need for fungicide application'
      ];
      preventativeMeasures = [
        ...commonPreventative,
        'Time planting to avoid peak pest pressure periods'
      ];
      break;
      
    case 'soybean':
      immediateActions = [
        ...commonImmediate,
        'Scout for soybean cyst nematode',
        'Check for signs of sudden death syndrome'
      ];
      preventativeMeasures = [
        ...commonPreventative,
        'Consider seed treatments for next planting'
      ];
      break;
    
    default:
      immediateActions = commonImmediate;
      preventativeMeasures = commonPreventative;
  }
  
  // Combine all recommendations
  return {
    immediateActions: immediateActions,
    preventativeMeasures: preventativeMeasures,
    longTermStrategies: commonLongTerm,
    additionalResources: [
      'Local agricultural extension service',
      'University crop research publications',
      'Agricultural weather forecasting services'
    ],
    confidenceScore: 0.6
  };
}

// Yield prediction fallback
export function getYieldPredictionFallback(cropType: string, healthStatus: string) {
  const cropTypeFormatted = cropType.toLowerCase();
  const healthStatusLower = healthStatus.toLowerCase();
  
  let prediction = '';
  let confidenceLevel = 0.6;
  let factors = [
    'Current crop health status',
    'Historical yield averages for similar conditions',
    'Regional growing patterns'
  ];
  
  // Determine yield prediction based on crop type and health status
  switch (cropTypeFormatted) {
    case 'corn':
    case 'maize':
      if (healthStatusLower.includes('excellent')) {
        prediction = 'Expected yield of 180-200 bushels per acre, which is above the regional average.';
        confidenceLevel = 0.75;
      } else if (healthStatusLower.includes('good')) {
        prediction = 'Expected yield of 160-180 bushels per acre, which is in line with regional averages.';
        confidenceLevel = 0.7;
      } else if (healthStatusLower.includes('moderate')) {
        prediction = 'Expected yield of 140-160 bushels per acre, which is slightly below regional averages.';
        confidenceLevel = 0.65;
      } else {
        prediction = 'Expected yield of 100-140 bushels per acre, which is significantly below regional averages.';
        confidenceLevel = 0.6;
      }
      factors.push('Corn typically shows strong yield response to adequate moisture during pollination');
      factors.push('Nitrogen management is critical for corn yield potential');
      break;
      
    case 'wheat':
      if (healthStatusLower.includes('excellent')) {
        prediction = 'Expected yield of 70-80 bushels per acre, which exceeds typical yields for the region.';
        confidenceLevel = 0.75;
      } else if (healthStatusLower.includes('good')) {
        prediction = 'Expected yield of 60-70 bushels per acre, which meets regional benchmarks.';
        confidenceLevel = 0.7;
      } else if (healthStatusLower.includes('moderate')) {
        prediction = 'Expected yield of 50-60 bushels per acre, which is slightly below average for the region.';
        confidenceLevel = 0.65;
      } else {
        prediction = 'Expected yield of 35-50 bushels per acre, which represents a significant reduction from average.';
        confidenceLevel = 0.6;
      }
      factors.push('Wheat yields are often determined by tiller development and grain fill period');
      factors.push('Disease pressure during heading can significantly impact final wheat yields');
      break;
      
    case 'soybean':
      if (healthStatusLower.includes('excellent')) {
        prediction = 'Expected yield of 55-65 bushels per acre, which is above the regional average.';
        confidenceLevel = 0.75;
      } else if (healthStatusLower.includes('good')) {
        prediction = 'Expected yield of 45-55 bushels per acre, aligning with typical regional yields.';
        confidenceLevel = 0.7;
      } else if (healthStatusLower.includes('moderate')) {
        prediction = 'Expected yield of 40-45 bushels per acre, slightly below regional averages.';
        confidenceLevel = 0.65;
      } else {
        prediction = 'Expected yield of 30-40 bushels per acre, representing a yield gap from potential.';
        confidenceLevel = 0.6;
      }
      factors.push('Soybean yield is heavily influenced by pod count and seeds per pod');
      factors.push('Late-season drought can significantly impact final soybean yield');
      break;
    
    case 'rice':
      if (healthStatusLower.includes('excellent')) {
        prediction = 'Expected yield of 8500-9500 pounds per acre, exceeding typical yields.';
        confidenceLevel = 0.75;
      } else if (healthStatusLower.includes('good')) {
        prediction = 'Expected yield of 7500-8500 pounds per acre, meeting regional expectations.';
        confidenceLevel = 0.7;
      } else if (healthStatusLower.includes('moderate')) {
        prediction = 'Expected yield of 6500-7500 pounds per acre, below the potential for the region.';
        confidenceLevel = 0.65;
      } else {
        prediction = 'Expected yield of 5000-6500 pounds per acre, significantly below potential.';
        confidenceLevel = 0.6;
      }
      factors.push('Rice yield is particularly sensitive to water management');
      factors.push('Nitrogen timing and rate strongly influence rice productivity');
      break;
      
    default:
      if (healthStatusLower.includes('excellent')) {
        prediction = 'Expected yield is estimated to be 20-25% above regional averages for this crop.';
      } else if (healthStatusLower.includes('good')) {
        prediction = 'Expected yield is estimated to be in line with regional averages for this crop.';
      } else if (healthStatusLower.includes('moderate')) {
        prediction = 'Expected yield is estimated to be 10-15% below regional averages for this crop.';
      } else {
        prediction = 'Expected yield is estimated to be 20-30% below regional averages for this crop.';
      }
      confidenceLevel = 0.5; // Lower confidence for generic crops
  }
  
  // Add common factors
  factors.push('Weather forecast for the remainder of the growing season');
  factors.push('Pest and disease pressure assessments');
  
  return {
    prediction,
    confidenceLevel,
    factors
  };
}