import { Comparable, Adjustment } from '@shared/schema';

// Define a type for calculated results
export interface CalculationResult {
  netAdjustment: number;
  grossAdjustment: number;
  adjustedPrice: number;
  netAdjustmentPercentage: number;
  grossAdjustmentPercentage: number;
}

/**
 * Calculate adjustments for a comparable property
 */
export function calculateAdjustments(comparable: Comparable, adjustments: Adjustment[]): CalculationResult {
  // Filter adjustments for this comparable
  const comparableAdjustments = adjustments.filter(
    adj => adj.comparableId === comparable.id
  );
  
  // Default result with zeros
  const result: CalculationResult = {
    netAdjustment: 0,
    grossAdjustment: 0,
    adjustedPrice: comparable.salePrice ? Number(comparable.salePrice) : 0,
    netAdjustmentPercentage: 0,
    grossAdjustmentPercentage: 0
  };
  
  // If no adjustments or no sale price, return default result
  if (comparableAdjustments.length === 0 || !comparable.salePrice) {
    return result;
  }
  
  // Calculate the net adjustment (sum of all adjustments)
  const netAdjustment = comparableAdjustments.reduce(
    (sum, adj) => sum + Number(adj.amount),
    0
  );
  
  // Calculate the gross adjustment (sum of absolute values of all adjustments)
  const grossAdjustment = comparableAdjustments.reduce(
    (sum, adj) => sum + Math.abs(Number(adj.amount)),
    0
  );
  
  // Calculate the adjusted price (sale price + net adjustment)
  const adjustedPrice = Number(comparable.salePrice) + netAdjustment;
  
  // Calculate the net adjustment as a percentage of sale price
  const netAdjustmentPercentage = (netAdjustment / Number(comparable.salePrice)) * 100;
  
  // Calculate the gross adjustment as a percentage of sale price
  const grossAdjustmentPercentage = (grossAdjustment / Number(comparable.salePrice)) * 100;
  
  return {
    netAdjustment,
    grossAdjustment,
    adjustedPrice,
    netAdjustmentPercentage,
    grossAdjustmentPercentage
  };
}

/**
 * Calculate the indicated value based on adjusted prices of comparables
 */
export function calculateIndicatedValue(comparables: Comparable[], adjustments: Adjustment[]): number | null {
  // If no comparables, return null
  if (comparables.length === 0) {
    return null;
  }
  
  // Calculate adjusted prices for all comparables
  const adjustedPrices = comparables.map(comp => {
    const calculationResult = calculateAdjustments(comp, adjustments);
    return calculationResult.adjustedPrice;
  });
  
  // Filter out any zero values that might occur from comparables without prices
  const validPrices = adjustedPrices.filter(price => price > 0);
  
  // If no valid prices, return null
  if (validPrices.length === 0) {
    return null;
  }
  
  // Calculate the average of all adjusted prices
  const sum = validPrices.reduce((total, price) => total + price, 0);
  const average = sum / validPrices.length;
  
  // Round to nearest thousand
  return Math.round(average / 1000) * 1000;
}

/**
 * Calculate the price per square foot for a property
 */
export function calculatePricePerSqFt(price: number | string | null | undefined, area: number | string | null | undefined): number | null {
  if (price === null || price === undefined || area === null || area === undefined) {
    return null;
  }
  
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  const numArea = typeof area === 'string' ? parseFloat(area) : area;
  
  if (isNaN(numPrice) || isNaN(numArea) || numArea === 0) {
    return null;
  }
  
  return numPrice / numArea;
}

/**
 * Calculate a site adjustment based on price per square foot
 */
export function calculateSiteAdjustment(
  subjectSiteSize: number, 
  compSiteSize: number, 
  pricePerSqFt: number,
  adjustmentFactor: number = 0.3 // Default to 30% of price per sq ft for site adjustments
): number {
  // Calculate the difference in size
  const sizeDifference = subjectSiteSize - compSiteSize;
  
  // Apply the adjustment factor to the price per square foot
  const adjustmentRate = pricePerSqFt * adjustmentFactor;
  
  // Calculate the adjustment
  return sizeDifference * adjustmentRate;
}

/**
 * Calculate a GLA (Gross Living Area) adjustment
 */
export function calculateGlaAdjustment(
  subjectGla: number,
  compGla: number,
  pricePerSqFt: number,
  adjustmentFactor: number = 0.8 // Default to 80% of price per sq ft for GLA adjustments
): number {
  // Calculate the difference in GLA
  const glaDifference = subjectGla - compGla;
  
  // Apply the adjustment factor to the price per square foot
  const adjustmentRate = pricePerSqFt * adjustmentFactor;
  
  // Calculate the adjustment
  return glaDifference * adjustmentRate;
}

/**
 * Calculate a time adjustment based on monthly appreciation rate
 */
export function calculateTimeAdjustment(
  monthsDifference: number,
  salePrice: number,
  monthlyAppreciationRate: number = 0.005 // Default to 0.5% per month
): number {
  // Calculate the adjustment
  return salePrice * monthlyAppreciationRate * monthsDifference;
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(numValue) ? "" : `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return isNaN(value) ? "" : `${value.toFixed(1)}%`;
}
