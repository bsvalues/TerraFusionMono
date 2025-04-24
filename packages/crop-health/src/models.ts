import { z } from 'zod';

/**
 * Crop Health Status
 */
export enum CropHealthStatus {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  CRITICAL = 'critical',
}

/**
 * Risk Level
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  SEVERE = 'severe',
}

/**
 * Growth Stage
 */
export enum GrowthStage {
  GERMINATION = 'germination',
  SEEDLING = 'seedling', 
  VEGETATIVE = 'vegetative',
  FLOWERING = 'flowering',
  FRUITING = 'fruiting',
  MATURITY = 'maturity',
  SENESCENCE = 'senescence',
}

/**
 * Weather Risk Types
 */
export enum WeatherRiskType {
  DROUGHT = 'drought',
  FROST = 'frost',
  FLOOD = 'flood',
  HEAT_STRESS = 'heat_stress',
  WIND_DAMAGE = 'wind_damage',
  HAIL = 'hail',
}

/**
 * Pest Risk Types 
 */
export enum PestRiskType {
  INSECT = 'insect',
  FUNGAL = 'fungal',
  BACTERIAL = 'bacterial',
  VIRAL = 'viral',
  WEED = 'weed',
}

/**
 * Nutritional Deficiency Risk Types
 */
export enum NutritionalDeficiencyType {
  NITROGEN = 'nitrogen',
  PHOSPHORUS = 'phosphorus',
  POTASSIUM = 'potassium',
  CALCIUM = 'calcium',
  MAGNESIUM = 'magnesium',
  SULFUR = 'sulfur',
  IRON = 'iron',
  ZINC = 'zinc',
  MANGANESE = 'manganese',
  BORON = 'boron',
}

/**
 * Risk Factor
 */
export interface RiskFactor {
  type: string;
  riskLevel: RiskLevel;
  probability: number; // 0-1
  impact: number; // 1-10
  description: string;
  mitigationSteps: string[];
}

/**
 * Weather Risk Factor
 */
export interface WeatherRiskFactor extends RiskFactor {
  type: WeatherRiskType;
  forecastedDate?: Date;
}

/**
 * Pest Risk Factor
 */
export interface PestRiskFactor extends RiskFactor {
  type: PestRiskType;
  pestName?: string;
  signs: string[];
}

/**
 * Nutritional Deficiency Risk Factor
 */
export interface NutritionalRiskFactor extends RiskFactor {
  type: NutritionalDeficiencyType;
  symptoms: string[];
  soilConditions?: string[];
}

/**
 * Growth Prediction
 */
export interface GrowthPrediction {
  currentStage: GrowthStage;
  progress: number; // 0-1, percentage through current stage
  estimatedHarvestDate: Date;
  yieldPrediction: {
    expectedYield: number;
    unit: string;
    confidence: number; // 0-1
    comparisonToPrevious: number; // percentage +/- compared to previous
  };
  growthTrend: 'accelerating' | 'steady' | 'slowing' | 'stressed';
}

/**
 * Crop Health Insights
 */
export interface CropHealthInsights {
  parcelId: number;
  cropType: string;
  analysisDate: Date;
  overallHealth: CropHealthStatus;
  healthScore: number; // 0-100
  confidenceLevel: number; // 0-1
  riskFactors: RiskFactor[];
  growthPrediction: GrowthPrediction;
  recommendedActions: string[];
  visualIndicators: string[];
  historicalTrend: {
    period: string;
    trend: 'improving' | 'stable' | 'declining';
    details: string;
  };
}

/**
 * Health Analysis Request Schema
 */
export const healthAnalysisRequestSchema = z.object({
  parcelId: z.number(),
  timestamp: z.string().datetime().optional(),
  includeRecommendations: z.boolean().default(true),
  detailLevel: z.enum(['basic', 'standard', 'detailed']).default('standard'),
});

export type HealthAnalysisRequest = z.infer<typeof healthAnalysisRequestSchema>;

/**
 * Quick Health Check Request Schema
 */
export const quickHealthCheckRequestSchema = z.object({
  parcelId: z.number(),
  cropType: z.string(),
  soilConditions: z.array(z.string()).optional(),
  recentWeather: z.array(z.object({
    date: z.string().datetime(),
    condition: z.string(),
    temperatureC: z.number(),
    precipitation: z.number(),
    humidity: z.number().optional(),
  })).optional(),
  growthStage: z.nativeEnum(GrowthStage).optional(),
  currentSymptoms: z.array(z.string()).optional(),
});

export type QuickHealthCheckRequest = z.infer<typeof quickHealthCheckRequestSchema>;