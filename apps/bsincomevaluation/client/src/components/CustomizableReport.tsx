import React, { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePDF } from 'react-to-pdf';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/formatters';
import { FileDown, Printer, Calendar, DollarSign, BarChart3, TrendingUp, Settings } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CustomizableReportProps {
  valuation: any;
  valuations: any[];
  incomes: any[];
}

interface ReportSettings {
  title: string;
  description: string;
  sections: {
    summary: boolean;
    incomeAnalysis: boolean;
    historicalPerformance: boolean;
    notes: boolean;
  };
  metrics: {
    valuationAmount: boolean;
    totalAnnualIncome: boolean;
    multiplier: boolean;
  };
  chart: {
    includeCharts: boolean;
    pieChart: boolean;
    lineChart: boolean;
  };
  companyInfo: {
    includeCompanyInfo: boolean;
    companyName: string;
    companyLogo?: string;
  };
  exportOptions: {
    includeTimestamp: boolean;
    includePageNumbers: boolean;
  };
}

// Helper function to parse income breakdown JSON
const parseIncomeBreakdown = (breakdownStr: string) => {
  try {
    return JSON.parse(breakdownStr);
  } catch (e) {
    console.error('Failed to parse income breakdown:', e);
    return {};
  }
};

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export const CustomizableReport: React.FC<CustomizableReportProps> = ({ valuation, valuations, incomes }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const { toPDF, targetRef } = usePDF({
    filename: valuation ? `valuation-report-${valuation.name?.replace(/\\s+/g, '-').toLowerCase()}.pdf` : 'valuation-report.pdf',
  });
  
  // Default report settings
  const [settings, setSettings] = useState<ReportSettings>({
    title: 'Valuation Report',
    description: valuation ? `Report for ${valuation.name}` : 'Customizable Valuation Report',
    sections: {
      summary: true,
      incomeAnalysis: true,
      historicalPerformance: true,
      notes: true,
    },
    metrics: {
      valuationAmount: true,
      totalAnnualIncome: true,
      multiplier: true,
    },
    chart: {
      includeCharts: true,
      pieChart: true,
      lineChart: true,
    },
    companyInfo: {
      includeCompanyInfo: false,
      companyName: '',
    },
    exportOptions: {
      includeTimestamp: true,
      includePageNumbers: true,
    }
  });
  
  // Update description when valuation changes
  useEffect(() => {
    if (valuation) {
      setSettings(prev => ({
        ...prev,
        description: `Report for ${valuation.name}`
      }));
    }
  }, [valuation]);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const sortedValuations = [...valuations].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  
  // Prepare valuation history data for charts
  const valuationHistoryData = sortedValuations.map(val => ({
    date: formatDate(val.createdAt),
    amount: parseFloat(val.valuationAmount),
    income: parseFloat(val.totalAnnualIncome),
    name: val.name,
    multiplier: parseFloat(val.multiplier)
  }));
  
  // Prepare income distribution data for pie chart
  const incomeDistributionData = valuation 
    ? Object.entries(parseIncomeBreakdown(valuation.incomeBreakdown)).map(([source, amount]) => ({
        name: source,
        value: Number(amount)
      }))
    : [];
  
  // Fetch income analysis data
  const { data: incomeAnalysis } = useQuery({
    queryKey: ['/api/agents/analyze-income'],
    queryFn: async () => {
      const response = await fetch('/api/agents/analyze-income');
      if (!response.ok) throw new Error('Failed to fetch income analysis');
      return response.json();
    },
    enabled: incomes.length > 0
  });
  
  // Fetch anomaly detection data
  const { data: anomalyData } = useQuery({
    queryKey: ['/api/agents/detect-anomalies'],
    queryFn: async () => {
      const response = await fetch('/api/agents/detect-anomalies');
      if (!response.ok) throw new Error('Failed to detect anomalies');
      return response.json();
    },
    enabled: valuations.length > 1
  });
  
  // Fetch valuation summary
  const { data: valuationSummary } = useQuery({
    queryKey: ['/api/agents/valuation-summary'],
    queryFn: async () => {
      const response = await fetch('/api/agents/valuation-summary');
      if (!response.ok) throw new Error('Failed to fetch valuation summary');
      return response.json();
    },
    enabled: valuations.length > 0
  });
  
  if (!valuation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Valuation Selected</CardTitle>
          <CardDescription>Please select a valuation to generate a report</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Choose a valuation from your list to see detailed analysis and reports.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate growth metrics if we have more than one valuation
  const previousValuation = sortedValuations.length > 1 && valuation.id !== sortedValuations[0].id
    ? sortedValuations[sortedValuations.findIndex(v => v.id === valuation.id) - 1]
    : null;
  
  const growthRate = previousValuation
    ? ((parseFloat(valuation.valuationAmount) - parseFloat(previousValuation.valuationAmount)) / parseFloat(previousValuation.valuationAmount)) * 100
    : 0;
  
  const incomeDiff = previousValuation
    ? parseFloat(valuation.totalAnnualIncome) - parseFloat(previousValuation.totalAnnualIncome)
    : 0;
  
  const multiplierDiff = previousValuation
    ? parseFloat(valuation.multiplier) - parseFloat(previousValuation.multiplier)
    : 0;
  
  // Handler for settings changes
  const handleSettingChange = (category: keyof ReportSettings, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };
  
  // Handler for simple string settings
  const handleSimpleChange = (field: keyof ReportSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  return (
    <div className="space-y-6">
      {/* Settings Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="mb-4">
            <Settings className="h-4 w-4 mr-2" />
            Customize Report
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customize Report</DialogTitle>
            <DialogDescription>
              Configure which sections and data to include in your report.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Tabs defaultValue="general">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="sections">Sections</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>
              
              {/* General Settings */}
              <TabsContent value="general" className="space-y-4 py-4">
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="report-title" className="text-right">
                      Report Title
                    </Label>
                    <Input
                      id="report-title"
                      value={settings.title}
                      className="col-span-3"
                      onChange={(e) => handleSimpleChange('title', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="report-description" className="text-right">
                      Report Description
                    </Label>
                    <Input
                      id="report-description"
                      value={settings.description}
                      className="col-span-3"
                      onChange={(e) => handleSimpleChange('description', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="company-info" className="text-right">
                      Include Company Info
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="company-info"
                        checked={settings.companyInfo.includeCompanyInfo}
                        onCheckedChange={(checked) => 
                          handleSettingChange('companyInfo', 'includeCompanyInfo', checked)
                        }
                      />
                      <Label htmlFor="company-info">Show Company Details</Label>
                    </div>
                  </div>
                  {settings.companyInfo.includeCompanyInfo && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="company-name" className="text-right">
                        Company Name
                      </Label>
                      <Input
                        id="company-name"
                        value={settings.companyInfo.companyName}
                        className="col-span-3"
                        onChange={(e) => 
                          handleSettingChange('companyInfo', 'companyName', e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Sections */}
              <TabsContent value="sections" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="summary-section"
                      checked={settings.sections.summary}
                      onCheckedChange={(checked) => 
                        handleSettingChange('sections', 'summary', checked)
                      }
                    />
                    <Label htmlFor="summary-section">Include Summary</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="income-analysis"
                      checked={settings.sections.incomeAnalysis}
                      onCheckedChange={(checked) => 
                        handleSettingChange('sections', 'incomeAnalysis', checked)
                      }
                    />
                    <Label htmlFor="income-analysis">Include Income Analysis</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="historical-performance"
                      checked={settings.sections.historicalPerformance}
                      onCheckedChange={(checked) => 
                        handleSettingChange('sections', 'historicalPerformance', checked)
                      }
                    />
                    <Label htmlFor="historical-performance">Include Historical Performance</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notes"
                      checked={settings.sections.notes}
                      onCheckedChange={(checked) => 
                        handleSettingChange('sections', 'notes', checked)
                      }
                    />
                    <Label htmlFor="notes">Include Notes</Label>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-charts"
                      checked={settings.chart.includeCharts}
                      onCheckedChange={(checked) => 
                        handleSettingChange('chart', 'includeCharts', checked)
                      }
                    />
                    <Label htmlFor="include-charts">Include Charts</Label>
                  </div>
                  {settings.chart.includeCharts && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="pie-chart"
                          checked={settings.chart.pieChart}
                          onCheckedChange={(checked) => 
                            handleSettingChange('chart', 'pieChart', checked)
                          }
                        />
                        <Label htmlFor="pie-chart">Include Pie Chart</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="line-chart"
                          checked={settings.chart.lineChart}
                          onCheckedChange={(checked) => 
                            handleSettingChange('chart', 'lineChart', checked)
                          }
                        />
                        <Label htmlFor="line-chart">Include Line Chart</Label>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
              
              {/* Metrics */}
              <TabsContent value="metrics" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="valuation-amount"
                      checked={settings.metrics.valuationAmount}
                      onCheckedChange={(checked) => 
                        handleSettingChange('metrics', 'valuationAmount', checked)
                      }
                    />
                    <Label htmlFor="valuation-amount">Include Valuation Amount</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="total-annual-income"
                      checked={settings.metrics.totalAnnualIncome}
                      onCheckedChange={(checked) => 
                        handleSettingChange('metrics', 'totalAnnualIncome', checked)
                      }
                    />
                    <Label htmlFor="total-annual-income">Include Total Annual Income</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="multiplier"
                      checked={settings.metrics.multiplier}
                      onCheckedChange={(checked) => 
                        handleSettingChange('metrics', 'multiplier', checked)
                      }
                    />
                    <Label htmlFor="multiplier">Include Multiplier</Label>
                  </div>
                </div>
              </TabsContent>
              
              {/* Export Options */}
              <TabsContent value="export" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-timestamp"
                      checked={settings.exportOptions.includeTimestamp}
                      onCheckedChange={(checked) => 
                        handleSettingChange('exportOptions', 'includeTimestamp', checked)
                      }
                    />
                    <Label htmlFor="include-timestamp">Include Timestamp</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-page-numbers"
                      checked={settings.exportOptions.includePageNumbers}
                      onCheckedChange={(checked) => 
                        handleSettingChange('exportOptions', 'includePageNumbers', checked)
                      }
                    />
                    <Label htmlFor="include-page-numbers">Include Page Numbers</Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button type="submit" onClick={() => setIsDialogOpen(false)}>
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Actual Report */}
      <div className="space-y-6" ref={targetRef}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <CardTitle className="text-2xl">{settings.title}</CardTitle>
              <CardDescription>{settings.description}</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button size="sm" onClick={() => toPDF()}>
                <FileDown className="mr-2 h-4 w-4" />
                Export as PDF
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="space-y-8">
              {/* Company Info (if enabled) */}
              {settings.companyInfo.includeCompanyInfo && settings.companyInfo.companyName && (
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold text-lg">{settings.companyInfo.companyName}</h3>
                  {settings.exportOptions.includeTimestamp && (
                    <p className="text-sm text-muted-foreground">
                      Generated on {formatDate(new Date())}
                    </p>
                  )}
                </div>
              )}
              
              {/* Summary Section */}
              {settings.sections.summary && (
                <section className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-semibold">Valuation Summary</h2>
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(valuation.createdAt)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {settings.metrics.valuationAmount && (
                      <div className="bg-muted rounded-lg p-6 text-center">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Valuation Amount</div>
                        <div className="text-3xl font-bold flex items-center justify-center">
                          <DollarSign className="h-5 w-5 mr-1" />
                          {formatCurrency(parseFloat(valuation.valuationAmount))}
                        </div>
                        {previousValuation && (
                          <div className={`text-xs mt-2 ${growthRate > 0 ? 'text-green-600' : growthRate < 0 ? 'text-red-600' : ''}`}>
                            {growthRate > 0 ? '↑' : growthRate < 0 ? '↓' : ''} {formatPercentage(Math.abs(growthRate) / 100)} from previous valuation
                          </div>
                        )}
                      </div>
                    )}
                    
                    {settings.metrics.totalAnnualIncome && (
                      <div className="bg-muted rounded-lg p-6 text-center">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Total Annual Income</div>
                        <div className="text-3xl font-bold flex items-center justify-center">
                          <DollarSign className="h-5 w-5 mr-1" />
                          {formatCurrency(parseFloat(valuation.totalAnnualIncome))}
                        </div>
                        {previousValuation && (
                          <div className={`text-xs mt-2 ${incomeDiff > 0 ? 'text-green-600' : incomeDiff < 0 ? 'text-red-600' : ''}`}>
                            {incomeDiff > 0 ? '↑' : incomeDiff < 0 ? '↓' : ''} {formatCurrency(Math.abs(incomeDiff))} from previous valuation
                          </div>
                        )}
                      </div>
                    )}
                    
                    {settings.metrics.multiplier && (
                      <div className="bg-muted rounded-lg p-6 text-center">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Income Multiplier</div>
                        <div className="text-3xl font-bold flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 mr-1" />
                          {valuation.multiplier}x
                        </div>
                        {previousValuation && (
                          <div className={`text-xs mt-2 ${multiplierDiff > 0 ? 'text-green-600' : multiplierDiff < 0 ? 'text-red-600' : ''}`}>
                            {multiplierDiff > 0 ? '↑' : multiplierDiff < 0 ? '↓' : ''} {Math.abs(multiplierDiff).toFixed(2)} from previous valuation
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {valuationSummary && (
                    <div className="mt-6">
                      <p className="mb-4">
                        {typeof valuationSummary?.text === 'string' 
                          ? valuationSummary.text 
                          : 'Valuation performance has shown positive growth trends over time.'}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Highlights</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {Array.isArray(valuationSummary?.highlights) ? 
                              valuationSummary.highlights.map((highlight, index) => (
                                <li key={index}>{highlight}</li>
                              )) : 
                              <li>Valuation metrics indicate strong financial performance</li>
                            }
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Key Trends</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {Array.isArray(valuationSummary?.trends) ?
                              valuationSummary.trends.map((trend, index) => (
                                <li key={index}>{trend}</li>
                              )) :
                              <li>Consistent growth trajectory observed in recent valuations</li>
                            }
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}
              
              {settings.sections.summary && (settings.sections.incomeAnalysis || settings.sections.historicalPerformance || settings.sections.notes) && (
                <Separator />
              )}
              
              {/* Income Analysis Section */}
              {settings.sections.incomeAnalysis && (
                <section className="space-y-4">
                  <h2 className="text-xl font-semibold">Income Analysis</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {settings.chart.includeCharts && settings.chart.pieChart && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Income Breakdown</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={incomeDistributionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {incomeDistributionData.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={COLORS[index % COLORS.length]} 
                                  />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(value as number)} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                    
                    {incomeAnalysis && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Key Findings</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          {incomeAnalysis.analysis.findings.map((finding, index) => (
                            <li key={index}>{finding}</li>
                          ))}
                        </ul>
                        
                        <h3 className="text-lg font-medium mt-5 mb-3">Recommendations</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          {incomeAnalysis.analysis.recommendations.map((recommendation, index) => (
                            <li key={index}>{recommendation}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {incomeAnalysis && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-muted rounded-lg p-4">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Diversification Score</div>
                        <div className="text-xl font-bold">
                          {(incomeAnalysis.analysis.metrics.diversificationScore * 100).toFixed(0)}%
                        </div>
                      </div>
                      
                      <div className="bg-muted rounded-lg p-4">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Stability Score</div>
                        <div className="text-xl font-bold">
                          {(incomeAnalysis.analysis.metrics.stabilityScore * 100).toFixed(0)}%
                        </div>
                      </div>
                      
                      <div className="bg-muted rounded-lg p-4">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Growth Potential</div>
                        <div className="text-xl font-bold">
                          {(incomeAnalysis.analysis.metrics.growthPotential * 100).toFixed(0)}%
                        </div>
                      </div>
                      
                      <div className="bg-muted rounded-lg p-4">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Seasonal Impact</div>
                        <div className="text-xl font-bold capitalize">
                          {incomeAnalysis.analysis.metrics.seasonalImpact}
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}
              
              {settings.sections.incomeAnalysis && (settings.sections.historicalPerformance || settings.sections.notes) && (
                <Separator />
              )}
              
              {/* Historical Performance Section */}
              {settings.sections.historicalPerformance && (
                <section className="space-y-4">
                  <h2 className="text-xl font-semibold">Historical Performance</h2>
                  
                  {settings.chart.includeCharts && settings.chart.lineChart && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-3">Valuation History</h3>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={valuationHistoryData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="amount"
                              name="Valuation Amount"
                              stroke="#8884d8"
                              activeDot={{ r: 8 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="income"
                              name="Annual Income"
                              stroke="#82ca9d"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  
                  {anomalyData && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Insights</h3>
                      <p className="mb-4">
                        {typeof anomalyData.summary === 'string' 
                          ? anomalyData.summary 
                          : 'Analysis of valuation data shows potential patterns and outliers.'}
                      </p>
                      
                      <ul className="list-disc pl-5 space-y-1">
                        {anomalyData.insights.map((insight, index) => (
                          <li key={index}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}
              
              {settings.sections.historicalPerformance && settings.sections.notes && (
                <Separator />
              )}
              
              {/* Notes Section */}
              {settings.sections.notes && (
                <section className="space-y-4">
                  <h2 className="text-xl font-semibold">Notes</h2>
                  <div className="bg-muted p-4 rounded-lg">
                    <p>{valuation.notes || 'No notes for this valuation.'}</p>
                  </div>
                </section>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between pt-4">
            {settings.exportOptions.includeTimestamp && (
              <div className="text-sm text-muted-foreground">
                Report generated on {formatDate(new Date())}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              Income Valuation Tracker
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};