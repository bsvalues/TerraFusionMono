import {
  PropertyData,
  ComparableProperty,
  MarketAdjustment,
  AIValuationResponse
} from './ai-agent';

/**
 * Mock implementation of performAutomatedValuation for testing and demo purposes
 */
export async function performAutomatedValuation(
  subjectProperty: PropertyData,
  comparableProperties: ComparableProperty[]
): Promise<AIValuationResponse> {
  console.log('Using mock AI agent for valuation');
  
  // Calculate a reasonable estimated value based on comparables
  let totalValue = 0;
  let count = 0;
  
  for (const comp of comparableProperties) {
    // Apply basic adjustments based on size difference
    const sizeDiff = subjectProperty.grossLivingArea - comp.grossLivingArea;
    const sizeAdjustment = sizeDiff * 200; // $200 per sq ft
    
    // Apply basic time adjustment (1% per month, max 6 months)
    const compSaleDate = new Date(comp.saleDate);
    const currentDate = new Date();
    const monthsDiff = Math.min(
      6,
      (currentDate.getFullYear() - compSaleDate.getFullYear()) * 12 +
      currentDate.getMonth() - compSaleDate.getMonth()
    );
    const timeAdjustment = comp.salePrice * (monthsDiff * 0.01);
    
    // Calculate adjusted value
    const adjustedValue = comp.salePrice + sizeAdjustment + timeAdjustment;
    totalValue += adjustedValue;
    count++;
  }
  
  // Calculate average value
  const estimatedValue = Math.round(totalValue / Math.max(1, count));
  
  // Generate mock adjustments
  const adjustments: MarketAdjustment[] = [];
  
  // Size adjustment
  if (comparableProperties.length > 0) {
    const comp = comparableProperties[0];
    const sizeDiff = subjectProperty.grossLivingArea - comp.grossLivingArea;
    if (sizeDiff !== 0) {
      adjustments.push({
        factor: 'GLA',
        description: 'Gross Living Area',
        amount: sizeDiff * 200,
        reasoning: `The comparable is ${Math.abs(sizeDiff)} sq ft ${sizeDiff < 0 ? 'larger' : 'smaller'} at $200/sq ft`
      });
    }
    
    // Room count adjustment
    const bedroomDiff = subjectProperty.bedrooms - comp.bedrooms;
    if (bedroomDiff !== 0) {
      adjustments.push({
        factor: 'Bedrooms',
        description: 'Bedroom Count',
        amount: bedroomDiff * 10000,
        reasoning: `The comparable has ${bedroomDiff < 0 ? 'more' : 'fewer'} bedrooms`
      });
    }
    
    // Bathroom count adjustment
    const bathroomDiff = subjectProperty.bathrooms - comp.bathrooms;
    if (bathroomDiff !== 0) {
      adjustments.push({
        factor: 'Bathrooms',
        description: 'Bathroom Count',
        amount: bathroomDiff * 15000,
        reasoning: `The comparable has ${bathroomDiff < 0 ? 'more' : 'fewer'} bathrooms`
      });
    }
    
    // Age adjustment
    const ageDiff = subjectProperty.yearBuilt - comp.yearBuilt;
    if (ageDiff !== 0) {
      adjustments.push({
        factor: 'Age',
        description: 'Year Built',
        amount: ageDiff * 1000,
        reasoning: `The comparable is ${ageDiff < 0 ? 'newer' : 'older'} by ${Math.abs(ageDiff)} years`
      });
    }
  }
  
  return {
    estimatedValue,
    confidenceLevel: 'medium',
    valueRange: {
      min: Math.round(estimatedValue * 0.95),
      max: Math.round(estimatedValue * 1.05)
    },
    adjustments,
    marketAnalysis: `The ${subjectProperty.city}, ${subjectProperty.state} market has been showing moderate growth over the past 6 months. Properties in this area typically sell within 30-45 days of listing. Interest rates have been stable, supporting continued buyer demand in this price range.`,
    comparableAnalysis: `The subject property was compared to ${comparableProperties.length} similar properties in the area. The comparable properties are in similar condition and offer similar amenities. Adjustments were made for differences in gross living area, room count, and age.`,
    valuationMethodology: `This valuation primarily uses the Sales Comparison Approach, analyzing recent sales of similar properties in the immediate market area. Adjustments were made for physical characteristics, market conditions, and location factors to derive the estimated value.`
  };
}

/**
 * Mock implementation of analyzeMarketTrends for testing and demo purposes
 */
export async function analyzeMarketTrends(
  location: { city: string; state: string; zipCode: string },
  propertyType: string
): Promise<string> {
  console.log('Using mock AI agent for market trends analysis');
  
  return `# Market Analysis: ${location.city}, ${location.state} ${location.zipCode} - ${propertyType} Properties

## Recent Market Activity (Past 6 Months)
The ${location.city} market for ${propertyType} properties has seen moderate activity over the past six months with approximately 120 transactions recorded. This represents a 5% increase in transaction volume compared to the same period last year.

## Price Trends
Median sale prices have increased by approximately 3.8% year-over-year, which is slightly below the regional average of 4.2%. The average price per square foot currently stands at $425, up from $410 at the beginning of the year.

## Days on Market
Properties in this market segment typically sell within 28 days of listing, a decrease from 32 days in the previous quarter. Well-priced properties in desirable neighborhoods often receive multiple offers and sell within 7-10 days.

## Supply and Demand Factors
Current inventory levels represent approximately 2.1 months of supply, indicating a seller's market. New construction in the area has been limited, keeping supply constraints in place. Buyer demand remains strong, particularly for move-in ready properties with updated features.

## Forecasted Market Direction
The market is expected to maintain stability with modest price appreciation of 2-3% over the next 12 months. Interest rate fluctuations could impact buyer affordability, but strong local employment and limited new construction should continue to support property values in the short to medium term.`;
}

/**
 * Mock implementation of recommendAdjustments for testing and demo purposes
 */
export async function recommendAdjustments(
  subjectProperty: PropertyData,
  comparableProperty: ComparableProperty
): Promise<MarketAdjustment[]> {
  console.log('Using mock AI agent for adjustment recommendations');
  
  const adjustments: MarketAdjustment[] = [];
  
  // Size adjustment
  const sizeDiff = subjectProperty.grossLivingArea - comparableProperty.grossLivingArea;
  if (sizeDiff !== 0) {
    adjustments.push({
      factor: 'GLA',
      description: 'Gross Living Area',
      amount: sizeDiff * 200,
      reasoning: `The comparable is ${Math.abs(sizeDiff)} sq ft ${sizeDiff < 0 ? 'larger' : 'smaller'} at $200/sq ft`
    });
  }
  
  // Lot size adjustment
  const lotSizeDiff = subjectProperty.lotSize - comparableProperty.lotSize;
  if (lotSizeDiff !== 0) {
    adjustments.push({
      factor: 'Lot Size',
      description: 'Lot Size Difference',
      amount: lotSizeDiff * 10,
      reasoning: `The comparable has a ${Math.abs(lotSizeDiff)} sq ft ${lotSizeDiff < 0 ? 'larger' : 'smaller'} lot at $10/sq ft`
    });
  }
  
  // Room count adjustment
  const bedroomDiff = subjectProperty.bedrooms - comparableProperty.bedrooms;
  if (bedroomDiff !== 0) {
    adjustments.push({
      factor: 'Bedrooms',
      description: 'Bedroom Count',
      amount: bedroomDiff * 10000,
      reasoning: `The comparable has ${bedroomDiff < 0 ? 'more' : 'fewer'} bedrooms (${Math.abs(bedroomDiff)} difference at $10,000 per bedroom)`
    });
  }
  
  // Bathroom count adjustment
  const bathroomDiff = subjectProperty.bathrooms - comparableProperty.bathrooms;
  if (bathroomDiff !== 0) {
    adjustments.push({
      factor: 'Bathrooms',
      description: 'Bathroom Count',
      amount: bathroomDiff * 15000,
      reasoning: `The comparable has ${bathroomDiff < 0 ? 'more' : 'fewer'} bathrooms (${Math.abs(bathroomDiff)} difference at $15,000 per bathroom)`
    });
  }
  
  // Age adjustment
  const ageDiff = subjectProperty.yearBuilt - comparableProperty.yearBuilt;
  if (ageDiff !== 0) {
    adjustments.push({
      factor: 'Age',
      description: 'Year Built',
      amount: ageDiff * 1000,
      reasoning: `The comparable is ${ageDiff < 0 ? 'newer' : 'older'} by ${Math.abs(ageDiff)} years at $1,000 per year of age difference`
    });
  }
  
  // Condition adjustment
  if (subjectProperty.condition !== comparableProperty.condition) {
    let amount = 0;
    if (subjectProperty.condition === 'Excellent' && comparableProperty.condition === 'Good') {
      amount = 15000;
    } else if (subjectProperty.condition === 'Excellent' && comparableProperty.condition === 'Average') {
      amount = 30000;
    } else if (subjectProperty.condition === 'Good' && comparableProperty.condition === 'Excellent') {
      amount = -15000;
    } else if (subjectProperty.condition === 'Good' && comparableProperty.condition === 'Average') {
      amount = 15000;
    } else if (subjectProperty.condition === 'Average' && comparableProperty.condition === 'Excellent') {
      amount = -30000;
    } else if (subjectProperty.condition === 'Average' && comparableProperty.condition === 'Good') {
      amount = -15000;
    }
    
    if (amount !== 0) {
      adjustments.push({
        factor: 'Condition',
        description: 'Property Condition',
        amount,
        reasoning: `The subject is in ${subjectProperty.condition} condition while the comparable is in ${comparableProperty.condition} condition`
      });
    }
  }
  
  // Quality adjustment
  if (subjectProperty.quality !== comparableProperty.quality) {
    let amount = 0;
    if (subjectProperty.quality === 'Above Average' && comparableProperty.quality === 'Average') {
      amount = 20000;
    } else if (subjectProperty.quality === 'Above Average' && comparableProperty.quality === 'Below Average') {
      amount = 40000;
    } else if (subjectProperty.quality === 'Average' && comparableProperty.quality === 'Above Average') {
      amount = -20000;
    } else if (subjectProperty.quality === 'Average' && comparableProperty.quality === 'Below Average') {
      amount = 20000;
    } else if (subjectProperty.quality === 'Below Average' && comparableProperty.quality === 'Above Average') {
      amount = -40000;
    } else if (subjectProperty.quality === 'Below Average' && comparableProperty.quality === 'Average') {
      amount = -20000;
    }
    
    if (amount !== 0) {
      adjustments.push({
        factor: 'Quality',
        description: 'Construction Quality',
        amount,
        reasoning: `The subject is of ${subjectProperty.quality} quality while the comparable is of ${comparableProperty.quality} quality`
      });
    }
  }
  
  // Time adjustment (market conditions)
  const saleDate = new Date(comparableProperty.saleDate);
  const currentDate = new Date();
  const monthsDiff = (currentDate.getFullYear() - saleDate.getFullYear()) * 12 + 
                    currentDate.getMonth() - saleDate.getMonth();
  
  if (monthsDiff > 0) {
    const ratePerMonth = 0.005; // 0.5% per month
    const amount = Math.round(comparableProperty.salePrice * ratePerMonth * monthsDiff);
    
    adjustments.push({
      factor: 'Market Conditions',
      description: 'Time/Date of Sale',
      amount,
      reasoning: `The comparable sold ${monthsDiff} months ago. Market appreciation estimated at 0.5% per month.`
    });
  }
  
  return adjustments;
}

/**
 * Mock implementation of generateValuationNarrative for testing and demo purposes
 */
export async function generateValuationNarrative(
  property: PropertyData,
  valuation: AIValuationResponse
): Promise<string> {
  console.log('Using mock AI agent for valuation narrative');
  
  return `# Valuation Narrative: ${property.address}, ${property.city}, ${property.state} ${property.zipCode}

## Subject Property Overview
The subject property is a ${property.yearBuilt} ${property.propertyType} located in ${property.city}, ${property.state}. The property features ${property.bedrooms} bedrooms and ${property.bathrooms} bathrooms, with a gross living area of ${property.grossLivingArea} square feet on a ${property.lotSize} square foot lot. The property is in ${property.condition || 'average'} condition with ${property.quality || 'average'} quality construction.

## Market Analysis
${valuation.marketAnalysis}

## Comparable Properties Analysis
${valuation.comparableAnalysis}

## Valuation Methodology
${valuation.valuationMethodology}

## Adjustments and Value Reconciliation
After analyzing the comparable sales and making appropriate adjustments for differences between the subject property and each comparable, the indicated value range for the subject property is $${valuation.valueRange.min.toLocaleString()} to $${valuation.valueRange.max.toLocaleString()}.

The following key adjustments were made:
${valuation.adjustments.map(adj => `- ${adj.factor}: ${adj.amount > 0 ? '+' : ''}$${adj.amount.toLocaleString()} - ${adj.reasoning}`).join('\n')}

## Conclusion
Based on the analysis of comparable sales and market conditions, the estimated market value of the subject property as of ${new Date().toLocaleDateString()} is $${valuation.estimatedValue.toLocaleString()}.

The confidence level for this valuation is ${valuation.confidenceLevel}, indicating that the value estimate is ${valuation.confidenceLevel === 'high' ? 'strongly supported by the market data' : valuation.confidenceLevel === 'medium' ? 'reasonably supported by the market data with some limitations' : 'supported by limited market data and may require additional verification'}.`;
}