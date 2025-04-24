import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ErrorBar,
  Cell
} from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CalendarIcon, TrendingUpIcon, DollarSignIcon, AlertCircleIcon } from "lucide-react";

interface YieldValue {
  value: number;
  unit: string;
}

interface ConfidenceInterval {
  low: number;
  high: number;
}

interface YieldScenario {
  name: string;
  yieldChange: number;
  probability: number;
}

interface MarketValueEstimate {
  perUnit: number;
  total: number;
  currency: string;
}

interface HistoricalYield {
  year: number;
  yield: number;
}

interface YieldPredictionCardProps {
  parcelId: string;
  cropType: string;
  predictedYield: YieldValue;
  confidenceInterval: ConfidenceInterval;
  confidenceLevel: number;
  scenarios: YieldScenario[];
  marketValueEstimate: MarketValueEstimate;
  harvestDateEstimate: string;
  historicalYields: HistoricalYield[];
  lastUpdated: string;
}

/**
 * Card displaying yield prediction data and historical comparisons
 */
export function YieldPredictionCard({
  parcelId,
  cropType,
  predictedYield,
  confidenceInterval,
  confidenceLevel,
  scenarios,
  marketValueEstimate,
  harvestDateEstimate,
  historicalYields,
  lastUpdated
}: YieldPredictionCardProps) {
  // Sort historical yields by year (ascending)
  const sortedHistoricalYields = [...historicalYields].sort((a, b) => a.year - b.year);
  
  // Prepare data for the chart
  const chartData = sortedHistoricalYields.map(item => ({
    year: item.year,
    yield: item.yield,
    isPrediction: false
  }));
  
  // Add the prediction point
  // Add the prediction data point
  // Note: We're using a type assertion here to add custom error bounds for the chart
  chartData.push({
    year: new Date().getFullYear(),
    yield: predictedYield.value,
    isPrediction: true,
    // Using any to add our custom error bounds for the chart
    ...(confidenceInterval && {
      errorHigh: confidenceInterval.high - predictedYield.value,
      errorLow: predictedYield.value - confidenceInterval.low
    })
  } as any);
  
  // Calculate average historical yield
  const avgHistoricalYield = historicalYields.length > 0 
    ? historicalYields.reduce((sum, item) => sum + item.yield, 0) / historicalYields.length
    : 0;
  
  // Determine if current prediction is above or below average
  const isPredictionAboveAvg = predictedYield.value > avgHistoricalYield;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: marketValueEstimate.currency,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Calculate days until harvest
  const daysUntilHarvest = () => {
    const harvestDate = new Date(harvestDateEstimate);
    const today = new Date();
    const diffTime = harvestDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Yield Prediction</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-800">
              {confidenceLevel * 100}% Confidence
            </Badge>
          </div>
        </div>
        <CardDescription className="flex items-center justify-between">
          <span>{cropType.charAt(0).toUpperCase() + cropType.slice(1)} yield forecast</span>
          <span className="text-xs flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            Updated: {lastUpdated.split('T')[0]}
          </span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-5 pb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-xs text-muted-foreground mb-1">Predicted Yield</h4>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{predictedYield.value}</span>
              <span className="text-sm text-muted-foreground">{predictedYield.unit}</span>
            </div>
            <div className="text-xs mt-1 text-muted-foreground">
              Range: {confidenceInterval.low} - {confidenceInterval.high} {predictedYield.unit}
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-xs text-muted-foreground mb-1">Market Value Estimate</h4>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{formatCurrency(marketValueEstimate.total)}</span>
            </div>
            <div className="text-xs mt-1 text-muted-foreground">
              {formatCurrency(marketValueEstimate.perUnit)} per {predictedYield.unit}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Estimated Harvest Date</p>
              <p className="text-xs text-muted-foreground">{new Date(harvestDateEstimate).toLocaleDateString()} ({daysUntilHarvest()} days remaining)</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TrendingUpIcon className={`h-4 w-4 ${isPredictionAboveAvg ? 'text-green-600' : 'text-red-600'}`} />
            <div>
              <p className="text-sm font-medium">vs. Historical Average</p>
              <p className={`text-xs ${isPredictionAboveAvg ? 'text-green-600' : 'text-red-600'}`}>
                {isPredictionAboveAvg ? '+' : ''}{(predictedYield.value - avgHistoricalYield).toFixed(1)} {predictedYield.unit}
              </p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h4 className="text-sm font-medium mb-4">Historical & Projected Yield</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" />
                <YAxis domain={['auto', 'auto']} />
                <RechartsTooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'yield') {
                      return [`${value} ${predictedYield.unit}`, 'Yield'];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label: any) => `Year: ${label}`}
                />
                <ReferenceLine
                  y={avgHistoricalYield}
                  label={{ value: 'Avg', position: 'insideTopLeft' }}
                  stroke="#8884d8"
                  strokeDasharray="3 3"
                />
                <Bar
                  dataKey="yield"
                  name="Yield"
                  fill="#8884d8"
                >
                  {/* Add cells for custom coloring */}
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isPrediction ? "#82ca9d" : "#8884d8"} 
                    />
                  ))}
                  <ErrorBar
                    dataKey="errorHigh"
                    direction="y"
                    width={4}
                    strokeWidth={1}
                  />
                  <ErrorBar
                    dataKey="errorLow"
                    direction="y"
                    width={4}
                    strokeWidth={1}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {scenarios.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Alternative Scenarios</h4>
            <div className="space-y-2">
              {scenarios.map((scenario, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircleIcon 
                      className={`h-4 w-4 ${scenario.yieldChange >= 0 ? 'text-green-600' : 'text-red-600'}`} 
                    />
                    <span>{scenario.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {(scenario.probability * 100).toFixed(0)}% chance
                    </Badge>
                    <span className={scenario.yieldChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {scenario.yieldChange > 0 ? '+' : ''}{scenario.yieldChange} {predictedYield.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}