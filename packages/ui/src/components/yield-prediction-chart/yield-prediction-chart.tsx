import * as React from 'react';
import { cn } from '../../utils';
import { 
  BarChart,
  TrendingUp, 
  CircleAlert,
  Cloud,
  Droplets,
  ThermometerSun,
  Sun,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../card';
import { Button } from '../button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip';

export interface YieldDataPoint {
  year: number;
  amount: number;
  unit: string;
  // Optional field for historical data
  isActual?: boolean;
}

export interface YieldPredictionFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  // Value between 0 and 1 representing strength of impact
  strength: number;
}

export interface YieldPredictionChartProps {
  /**
   * Title for the chart
   */
  title: string;
  /**
   * Crop type being forecasted
   */
  cropType: string;
  /**
   * Field or area name
   */
  fieldName?: string;
  /**
   * Historical and predicted yield data
   */
  data: YieldDataPoint[];
  /**
   * Key factors influencing the prediction
   */
  factors?: YieldPredictionFactor[];
  /**
   * Confidence level of prediction (0-1)
   */
  confidence?: number;
  /**
   * Timestamp when prediction was generated
   */
  predictionDate?: Date;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether the component is in loading state
   */
  loading?: boolean;
  /**
   * Error message if prediction failed
   */
  error?: string;
  /**
   * Callback when a year is selected
   */
  onYearSelect?: (year: number) => void;
  /**
   * Whether to show detailed factors
   */
  showDetailedFactors?: boolean;
  /**
   * Whether to show confidence information
   */
  showConfidence?: boolean;
  /**
   * Maximum number of factors to display
   */
  maxFactors?: number;
}

/**
 * Chart component for displaying crop yield predictions
 */
export const YieldPredictionChart = ({
  title,
  cropType,
  fieldName,
  data,
  factors = [],
  confidence = 0,
  predictionDate,
  className = '',
  loading = false,
  error,
  onYearSelect,
  showDetailedFactors = true,
  showConfidence = true,
  maxFactors = 3
}: YieldPredictionChartProps) => {
  // State to track if detailed factors are expanded
  const [factorsExpanded, setFactorsExpanded] = React.useState(false);
  
  // Filter data into historical and predicted
  const historicalData = data.filter(d => d.isActual);
  const predictedData = data.filter(d => !d.isActual);
  
  // Calculate min and max values for scaling
  const allAmounts = data.map(d => d.amount);
  const maxValue = Math.max(...allAmounts);
  const minValue = Math.min(...allAmounts);
  const valueRange = maxValue - minValue;
  
  // Get the unit from the first data point
  const unit = data.length > 0 ? data[0].unit : '';
  
  // Format date
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString();
  };
  
  // Get factor icon based on name
  const getFactorIcon = (name: string) => {
    const iconProps = { className: "h-4 w-4" };
    
    // Map factor names to appropriate icons
    const lowerName = name.toLowerCase();
    if (lowerName.includes('rain') || lowerName.includes('moisture') || lowerName.includes('water')) {
      return <Droplets {...iconProps} />;
    } else if (lowerName.includes('temperature') || lowerName.includes('heat')) {
      return <ThermometerSun {...iconProps} />;
    } else if (lowerName.includes('cloud') || lowerName.includes('weather')) {
      return <Cloud {...iconProps} />;
    } else if (lowerName.includes('sun') || lowerName.includes('light')) {
      return <Sun {...iconProps} />;
    } else {
      return <Info {...iconProps} />;
    }
  };
  
  // Get color for impact
  const getImpactColor = (impact: YieldPredictionFactor['impact']) => {
    switch (impact) {
      case 'positive':
        return 'text-terrafusion-green-600';
      case 'negative':
        return 'text-destructive';
      default:
        return 'text-slate-500';
    }
  };
  
  // Get impact symbol
  const getImpactSymbol = (impact: YieldPredictionFactor['impact']) => {
    switch (impact) {
      case 'positive':
        return <ChevronUp className="h-3 w-3 text-terrafusion-green-600" />;
      case 'negative':
        return <ChevronDown className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };
  
  // Get color for bar based on whether it's historical or predicted
  const getBarColor = (isActual?: boolean) => {
    return isActual ? 'bg-terrafusion-soil-500' : 'bg-terrafusion-green-500';
  };
  
  // Render loading state
  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-3/4"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-32 bg-slate-100 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive py-4">
            <CircleAlert className="h-10 w-10 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          {title}
        </CardTitle>
        {(cropType || fieldName) && (
          <div className="text-sm text-slate-500">
            {cropType}
            {fieldName && ` • ${fieldName}`}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pb-2">
        {/* Chart area */}
        <div className="h-52 mb-4 relative">
          {/* Y-axis label */}
          <div className="absolute -left-6 top-1/2 transform -rotate-90 text-xs text-slate-400">
            {`Yield (${unit})`}
          </div>
          
          {/* Chart bars */}
          <div className="h-full flex items-end justify-between px-6 gap-1 md:gap-3">
            {data.map((point, index) => {
              // Calculate height based on value range
              const heightPercentage = valueRange > 0 
                ? ((point.amount - minValue) / valueRange) * 80 + 20 // Min 20% height
                : 50; // Default if all values are the same
                
              return (
                <TooltipProvider key={point.year}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="flex flex-col items-center group"
                        onClick={() => onYearSelect?.(point.year)}
                      >
                        <div 
                          className={cn(
                            "w-6 md:w-10 rounded-t-sm transition-all group-hover:opacity-80",
                            getBarColor(point.isActual),
                            onYearSelect && "cursor-pointer"
                          )}
                          style={{ height: `${heightPercentage}%` }}
                        ></div>
                        <div className="text-xs mt-1">{point.year}</div>
                        
                        {/* Mark predicted data */}
                        {!point.isActual && (
                          <div className="text-xs text-terrafusion-green-600 font-medium">
                            {/* Small star or indicator for predicted */}
                            *
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm font-semibold">{point.year}</div>
                      <div className="text-xs">
                        {point.amount} {point.unit}
                        {!point.isActual && ' (Predicted)'}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs mb-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-terrafusion-soil-500 rounded mr-1"></div>
            Historical
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-terrafusion-green-500 rounded mr-1"></div>
            Predicted
          </div>
        </div>
        
        {/* Factors affecting prediction */}
        {factors.length > 0 && showDetailedFactors && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Key Prediction Factors</div>
              
              {factors.length > maxFactors && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs"
                  onClick={() => setFactorsExpanded(!factorsExpanded)}
                >
                  {factorsExpanded ? 'Show Less' : `+${factors.length - maxFactors} More`}
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              {factors
                .slice(0, factorsExpanded ? undefined : maxFactors)
                .map((factor, index) => (
                  <div key={index} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded">
                    <div className="flex items-center gap-1.5">
                      {getFactorIcon(factor.name)}
                      <span>{factor.name}</span>
                    </div>
                    
                    <div className={cn("flex items-center font-medium", getImpactColor(factor.impact))}>
                      {getImpactSymbol(factor.impact)}
                      {factor.strength > 0.7 ? 'Strong' : factor.strength > 0.3 ? 'Moderate' : 'Slight'}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        
        {/* Confidence indicator */}
        {showConfidence && confidence > 0 && (
          <div className="mt-4 flex items-center justify-between bg-slate-50 p-2 rounded">
            <div className="text-xs">Prediction Confidence</div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-16 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full",
                    confidence > 0.7 ? 'bg-terrafusion-green-500' : 
                    confidence > 0.4 ? 'bg-terrafusion-soil-500' : 'bg-destructive'
                  )}
                  style={{ width: `${confidence * 100}%` }}
                ></div>
              </div>
              <div className="text-xs font-medium">
                {Math.round(confidence * 100)}%
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      {predictionDate && (
        <CardFooter className="text-xs text-slate-500 pt-0 pb-2">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            Prediction generated on {formatDate(predictionDate)}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};