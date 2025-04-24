import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps
} from "recharts";
import { CalendarDays, CoinIcon, InfoIcon, TrendingUp } from "lucide-react";

interface YieldScenario {
  name: string;
  description: string;
  yieldChange: number;
  probability: number;
  yieldValue: number;
  marketValue: number;
}

interface YieldPredictionChartProps {
  parcelId: string;
  parcelName: string;
  cropType: string;
  baseYield: number;
  yieldUnit: string;
  confidenceLow: number;
  confidenceHigh: number;
  confidenceLevel: number;
  historicalYields?: Array<{
    year: number;
    yield: number;
    conditions?: string;
  }>;
  scenarios: YieldScenario[];
  marketValuePerUnit: number;
  harvestDate: string;
  lastUpdated: string;
}

/**
 * A component showing yield predictions with scenarios and historical comparison
 */
export function YieldPredictionChart({
  parcelId,
  parcelName,
  cropType,
  baseYield,
  yieldUnit,
  confidenceLow,
  confidenceHigh,
  confidenceLevel,
  historicalYields = [],
  scenarios,
  marketValuePerUnit,
  harvestDate,
  lastUpdated
}: YieldPredictionChartProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Prepare scenarios data for chart
  const scenariosChartData = scenarios.map(scenario => ({
    name: scenario.name.replace(' conditions', ''),
    yield: Math.round(scenario.yieldValue * 10) / 10,
    probability: Math.round(scenario.probability * 100),
    marketValue: scenario.marketValue
  }));

  // Prepare historical data for chart
  const historicalChartData = [...historicalYields]
    .sort((a, b) => a.year - b.year)
    .map(data => ({
      name: data.year.toString(),
      yield: data.yield,
      conditions: data.conditions
    }));

  // Add current year prediction to historical chart
  if (historicalChartData.length > 0) {
    historicalChartData.push({
      name: new Date().getFullYear().toString(),
      yield: baseYield,
      conditions: 'Predicted'
    });
  }

  // Custom tooltip for yield chart
  const renderYieldTooltip = (props: TooltipProps<number, string>) => {
    const { active, payload, label } = props;
    
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 border shadow-sm p-2 rounded-lg text-sm">
          <p className="font-semibold">{label}</p>
          <p>Yield: {data.yield} {yieldUnit}</p>
          {data.probability !== undefined && (
            <p>Probability: {data.probability}%</p>
          )}
          {data.marketValue !== undefined && (
            <p>Market Value: {formatCurrency(data.marketValue)}</p>
          )}
          {data.conditions && (
            <p className="text-xs text-muted-foreground mt-1">{data.conditions}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Yield Prediction</CardTitle>
            <CardDescription>
              {parcelName} ({cropType})
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {Math.round(confidenceLevel * 100)}% Confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border p-3 flex flex-col justify-center">
              <div className="text-sm text-muted-foreground mb-1">Base Yield Prediction</div>
              <div className="font-semibold text-2xl">{baseYield} {yieldUnit}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Range: {confidenceLow} - {confidenceHigh} {yieldUnit}
              </div>
            </div>
            
            <div className="rounded-lg border p-3 flex flex-col justify-center">
              <div className="text-sm text-muted-foreground mb-1 flex items-center">
                <CoinIcon className="h-4 w-4 mr-1" />
                Estimated Market Value
              </div>
              <div className="font-semibold text-2xl">{formatCurrency(baseYield * marketValuePerUnit)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                @ {formatCurrency(marketValuePerUnit)} per {yieldUnit}
              </div>
            </div>
            
            <div className="rounded-lg border p-3 flex flex-col justify-center">
              <div className="text-sm text-muted-foreground mb-1 flex items-center">
                <CalendarDays className="h-4 w-4 mr-1" />
                Estimated Harvest Date
              </div>
              <div className="font-semibold text-lg">{harvestDate}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Optimal timing maximizes yield quality
              </div>
            </div>
          </div>

          <Tabs defaultValue="scenarios" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="scenarios">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Scenarios
                </div>
              </TabsTrigger>
              <TabsTrigger value="historical">
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Historical Comparison
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scenarios">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={scenariosChartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={true}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      tickFormatter={(value) => `${value} ${yieldUnit}`}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip content={renderYieldTooltip} />
                    <Legend wrapperStyle={{ paddingTop: 10 }} />
                    <Bar 
                      yAxisId="left"
                      dataKey="yield"
                      fill="#4f46e5"
                      name={`Yield (${yieldUnit})`}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="probability"
                      fill="#22c55e"
                      name="Probability (%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="historical">
              {historicalChartData.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  No historical data available
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={historicalChartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={true}
                      />
                      <YAxis 
                        tickFormatter={(value) => `${value} ${yieldUnit}`}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={renderYieldTooltip} />
                      <Area
                        type="monotone"
                        dataKey="yield"
                        name={`Yield (${yieldUnit})`}
                        stroke="#4f46e5"
                        fill="#4f46e5"
                        fillOpacity={0.2}
                        activeDot={{ r: 8 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      <CardFooter className="pt-2 text-xs text-muted-foreground">
        <div className="flex items-center">
          <InfoIcon className="h-3 w-3 mr-1" />
          Last updated: {lastUpdated}
        </div>
      </CardFooter>
    </Card>
  );
}