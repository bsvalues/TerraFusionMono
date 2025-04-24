import { GrowthStage } from '../models';

// Crop growth data by type
interface CropGrowthData {
  [cropType: string]: {
    stages: {
      [stage in GrowthStage]?: {
        minDays: number;
        maxDays: number;
        gddRequired?: number; // Growing Degree Days
      };
    };
    totalDaysToHarvest: {
      min: number;
      max: number;
    };
    gddToHarvest?: number; // Total Growing Degree Days required
  };
}

// Reference data for common crops
// In a real application, this would be much more comprehensive and
// would take into account different varieties, regions, etc.
const cropGrowthReference: CropGrowthData = {
  'corn': {
    stages: {
      [GrowthStage.GERMINATION]: { minDays: 5, maxDays: 10, gddRequired: 125 },
      [GrowthStage.SEEDLING]: { minDays: 7, maxDays: 15, gddRequired: 275 },
      [GrowthStage.VEGETATIVE]: { minDays: 25, maxDays: 40, gddRequired: 750 },
      [GrowthStage.FLOWERING]: { minDays: 7, maxDays: 14, gddRequired: 200 },
      [GrowthStage.FRUITING]: { minDays: 35, maxDays: 50, gddRequired: 850 },
      [GrowthStage.MATURITY]: { minDays: 15, maxDays: 25, gddRequired: 300 },
    },
    totalDaysToHarvest: { min: 90, max: 120 },
    gddToHarvest: 2500,
  },
  'soybean': {
    stages: {
      [GrowthStage.GERMINATION]: { minDays: 4, maxDays: 10, gddRequired: 90 },
      [GrowthStage.SEEDLING]: { minDays: 7, maxDays: 15, gddRequired: 200 },
      [GrowthStage.VEGETATIVE]: { minDays: 20, maxDays: 35, gddRequired: 600 },
      [GrowthStage.FLOWERING]: { minDays: 10, maxDays: 20, gddRequired: 250 },
      [GrowthStage.FRUITING]: { minDays: 25, maxDays: 35, gddRequired: 600 },
      [GrowthStage.MATURITY]: { minDays: 15, maxDays: 25, gddRequired: 300 },
    },
    totalDaysToHarvest: { min: 80, max: 110 },
    gddToHarvest: 2040,
  },
  'wheat': {
    stages: {
      [GrowthStage.GERMINATION]: { minDays: 3, maxDays: 10 },
      [GrowthStage.SEEDLING]: { minDays: 10, maxDays: 20 },
      [GrowthStage.VEGETATIVE]: { minDays: 20, maxDays: 40 },
      [GrowthStage.FLOWERING]: { minDays: 5, maxDays: 10 },
      [GrowthStage.FRUITING]: { minDays: 20, maxDays: 30 },
      [GrowthStage.MATURITY]: { minDays: 15, maxDays: 25 },
    },
    totalDaysToHarvest: { min: 100, max: 130 },
  },
  'rice': {
    stages: {
      [GrowthStage.GERMINATION]: { minDays: 4, maxDays: 10 },
      [GrowthStage.SEEDLING]: { minDays: 10, maxDays: 25 },
      [GrowthStage.VEGETATIVE]: { minDays: 25, maxDays: 45 },
      [GrowthStage.FLOWERING]: { minDays: 10, maxDays: 15 },
      [GrowthStage.FRUITING]: { minDays: 20, maxDays: 30 },
      [GrowthStage.MATURITY]: { minDays: 20, maxDays: 30 },
    },
    totalDaysToHarvest: { min: 90, max: 150 },
  },
  'cotton': {
    stages: {
      [GrowthStage.GERMINATION]: { minDays: 5, maxDays: 10 },
      [GrowthStage.SEEDLING]: { minDays: 10, maxDays: 20 },
      [GrowthStage.VEGETATIVE]: { minDays: 30, maxDays: 50 },
      [GrowthStage.FLOWERING]: { minDays: 20, maxDays: 30 },
      [GrowthStage.FRUITING]: { minDays: 40, maxDays: 60 },
      [GrowthStage.MATURITY]: { minDays: 20, maxDays: 30 },
    },
    totalDaysToHarvest: { min: 130, max: 180 },
  },
};

/**
 * Calculate the number of days a crop has been growing
 * @param plantingDate The date the crop was planted
 * @param currentDate Optional current date (defaults to today)
 * @returns Number of days since planting
 */
export function calculateGrowthDays(plantingDate: Date, currentDate: Date = new Date()): number {
  const plantDate = new Date(plantingDate); // Create a copy to avoid modifying the original
  const currentDay = new Date(currentDate);
  
  // Calculate difference in days
  const diffTime = Math.abs(currentDay.getTime() - plantDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Estimate the harvest date for a specific crop
 * @param cropType The type of crop
 * @param plantingDate The date the crop was planted
 * @param growthConditions Optional growth conditions factor (0.8 = slower, 1.2 = faster)
 * @returns Estimated harvest date
 */
export function estimateHarvestDate(
  cropType: string, 
  plantingDate: Date, 
  growthConditions: number = 1.0
): Date {
  const plantDate = new Date(plantingDate); // Create a copy to avoid modifying the original
  
  // Get reference data for the crop type
  const cropData = cropGrowthReference[cropType.toLowerCase()];
  
  if (!cropData) {
    // If crop type is unknown, use a default growth period of 120 days
    const harvestDate = new Date(plantDate);
    harvestDate.setDate(plantDate.getDate() + 120);
    return harvestDate;
  }
  
  // Calculate average days to harvest
  const avgDaysToHarvest = (cropData.totalDaysToHarvest.min + cropData.totalDaysToHarvest.max) / 2;
  
  // Adjust based on growth conditions
  const adjustedDays = Math.round(avgDaysToHarvest / growthConditions);
  
  // Calculate harvest date
  const harvestDate = new Date(plantDate);
  harvestDate.setDate(plantDate.getDate() + adjustedDays);
  
  return harvestDate;
}

/**
 * Determine the current growth stage based on days since planting
 * @param cropType The type of crop
 * @param plantingDate The date the crop was planted
 * @param currentDate Optional current date (defaults to today)
 * @returns Current growth stage and progress information
 */
export function determineGrowthStage(
  cropType: string, 
  plantingDate: Date, 
  currentDate: Date = new Date()
): { 
  stage: GrowthStage; 
  progress: number; 
  daysInStage: number;
  daysToNextStage: number | null;
  nextStage: GrowthStage | null;
} {
  const daysSincePlanting = calculateGrowthDays(plantingDate, currentDate);
  const crop = cropGrowthReference[cropType.toLowerCase()];
  
  if (!crop) {
    // If crop type is unknown, estimate based on a generic growth pattern
    return determineGenericGrowthStage(daysSincePlanting);
  }
  
  let dayCounter = 0;
  const stageSequence = [
    GrowthStage.GERMINATION,
    GrowthStage.SEEDLING,
    GrowthStage.VEGETATIVE,
    GrowthStage.FLOWERING,
    GrowthStage.FRUITING,
    GrowthStage.MATURITY,
    GrowthStage.SENESCENCE
  ];
  
  for (let i = 0; i < stageSequence.length; i++) {
    const stage = stageSequence[i];
    const stageData = crop.stages[stage];
    
    if (!stageData) {
      continue;
    }
    
    const stageDuration = (stageData.minDays + stageData.maxDays) / 2;
    
    if (dayCounter + stageDuration > daysSincePlanting) {
      // We're in this stage
      const daysInStage = daysSincePlanting - dayCounter;
      const progress = Math.min(1, daysInStage / stageDuration);
      const daysToNextStage = i < stageSequence.length - 1 
        ? Math.max(0, stageDuration - daysInStage)
        : null;
      
      return {
        stage,
        progress,
        daysInStage,
        daysToNextStage,
        nextStage: i < stageSequence.length - 1 ? stageSequence[i + 1] : null
      };
    }
    
    dayCounter += stageDuration;
  }
  
  // If we're past all stages, we're in senescence
  return {
    stage: GrowthStage.SENESCENCE,
    progress: 1,
    daysInStage: daysSincePlanting - dayCounter,
    daysToNextStage: null,
    nextStage: null
  };
}

/**
 * Calculate Growing Degree Days (GDD) from temperature data
 * @param minTemp Minimum temperature (°C)
 * @param maxTemp Maximum temperature (°C)
 * @param baseTemp Base temperature for the crop (°C)
 * @returns GDD value
 */
export function calculateGDD(minTemp: number, maxTemp: number, baseTemp: number = 10): number {
  // Formula: GDD = ((Daily Max Temp + Daily Min Temp) / 2) - Base Temp
  const avgTemp = (minTemp + maxTemp) / 2;
  
  // If average temperature is below base temperature, GDD is 0
  return Math.max(0, avgTemp - baseTemp);
}

/**
 * Determine growth stage for crops without specific reference data
 * @param daysSincePlanting Days since planting
 * @returns Generic growth stage estimation
 */
function determineGenericGrowthStage(daysSincePlanting: number): { 
  stage: GrowthStage; 
  progress: number; 
  daysInStage: number;
  daysToNextStage: number | null;
  nextStage: GrowthStage | null;
} {
  // Generic growth pattern (percentage of total growth cycle)
  const genericPattern = [
    { stage: GrowthStage.GERMINATION, duration: 0.07 }, // 7%
    { stage: GrowthStage.SEEDLING, duration: 0.13 },    // 13%
    { stage: GrowthStage.VEGETATIVE, duration: 0.30 },  // 30%
    { stage: GrowthStage.FLOWERING, duration: 0.15 },   // 15%
    { stage: GrowthStage.FRUITING, duration: 0.25 },    // 25%
    { stage: GrowthStage.MATURITY, duration: 0.10 },    // 10%
  ];
  
  // Assume a generic 120-day growth cycle
  const totalGrowthDays = 120;
  
  if (daysSincePlanting >= totalGrowthDays) {
    return {
      stage: GrowthStage.SENESCENCE,
      progress: 1,
      daysInStage: daysSincePlanting - totalGrowthDays,
      daysToNextStage: null,
      nextStage: null
    };
  }
  
  // Determine which stage we're in
  let cumulativeDuration = 0;
  
  for (let i = 0; i < genericPattern.length; i++) {
    const { stage, duration } = genericPattern[i];
    const stageDurationDays = duration * totalGrowthDays;
    
    if (daysSincePlanting < cumulativeDuration + stageDurationDays) {
      // We're in this stage
      const daysInStage = daysSincePlanting - cumulativeDuration;
      const progress = daysInStage / stageDurationDays;
      const daysToNextStage = stageDurationDays - daysInStage;
      
      return {
        stage,
        progress,
        daysInStage,
        daysToNextStage: i < genericPattern.length - 1 ? daysToNextStage : null,
        nextStage: i < genericPattern.length - 1 ? genericPattern[i + 1].stage : GrowthStage.SENESCENCE
      };
    }
    
    cumulativeDuration += stageDurationDays;
  }
  
  // Fallback (should not reach here)
  return {
    stage: GrowthStage.MATURITY,
    progress: 1,
    daysInStage: 0,
    daysToNextStage: 0,
    nextStage: GrowthStage.SENESCENCE
  };
}