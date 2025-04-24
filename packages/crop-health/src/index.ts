/**
 * TerraFusion Predictive Crop Health AI Insights
 * 
 * This module provides AI-powered analysis of agricultural parcels
 * to predict crop health, identify risks, and recommend actions.
 */

// Export all models and interfaces
export * from './models';

// Export the analysis service
export { CropHealthAnalysisService } from './analysis-service';

// Additional specialized analyzers
export { SoilAnalyzer } from './analyzers/soil-analyzer';
export { DiseaseDetector } from './analyzers/disease-detector';
export { YieldPredictor } from './analyzers/yield-predictor';

// Utility functions
export { calculateGrowthDays, estimateHarvestDate } from './utils/growth-calculations';