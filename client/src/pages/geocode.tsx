import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Map, Info, RefreshCw } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GeocodeSearch } from '@/components/geocode/geocode-search';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

// Interface for geocode metrics
interface GeocodeMetrics {
  totalCalls: number;
  callsThisMonth: number;
  callsToday: number;
  lastBillingDate: string;
  costPerCall: number;
  estimatedCharge: number;
  currency: string;
}

export default function GeocodePage() {
  const [activeTab, setActiveTab] = useState('geocode');
  const { toast } = useToast();
  
  // Query to fetch geocode usage metrics
  const { 
    data: metrics,
    isLoading: isLoadingMetrics,
    error: metricsError,
    refetch: refetchMetrics
  } = useQuery<GeocodeMetrics>({
    queryKey: ['/api/geocode/metrics'],
  });
  
  // Handle geocode result selection
  const handleResultSelected = (result: any) => {
    toast({
      title: 'Location Selected',
      description: `Selected: ${result.formattedAddress}`,
    });
    
    // Refetch metrics after a geocode operation
    setTimeout(() => {
      refetchMetrics();
    }, 1000);
  };
  
  // Format currency amount
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Geocoding Service</h1>
          <p className="text-muted-foreground mt-1">
            Convert addresses to coordinates with metered billing
          </p>
        </div>
      </div>
      
      {/* Usage summary cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingMetrics ? '...' : metrics?.callsToday || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              API calls made today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingMetrics ? '...' : metrics?.callsThisMonth || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              API calls this billing cycle
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingMetrics 
                ? '...' 
                : metrics 
                  ? formatCurrency(metrics.estimatedCharge, metrics.currency)
                  : formatCurrency(0)
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current billing cycle
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Error alert if metrics failed to load */}
      {metricsError && (
        <Alert variant="destructive" className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load geocoding metrics. {metricsError instanceof Error ? metricsError.message : ''}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Main content tabs */}
      <Tabs defaultValue="geocode" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="geocode">Geocoding Tool</TabsTrigger>
          <TabsTrigger value="billing">Billing Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="geocode">
          <Card>
            <CardHeader>
              <CardTitle>Address Search</CardTitle>
              <CardDescription>
                Search for an address to convert it to geographic coordinates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GeocodeSearch onResultSelected={handleResultSelected} />
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              <Info className="h-4 w-4 mr-2" />
              Each search counts as one geocoding API call for billing purposes
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Geocoding Billing Details</CardTitle>
              <CardDescription>
                Information about your usage and billing for the geocoding service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingMetrics ? (
                  <div className="flex justify-center items-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : metrics ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Cost Per Call</p>
                        <p className="text-xl">
                          {formatCurrency(metrics.costPerCall, metrics.currency)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Billing Cycle</p>
                        <p className="text-xl">
                          {new Date(metrics.lastBillingDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Usage</p>
                      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                        <Card className="bg-muted/50">
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Today</p>
                            <p className="text-xl font-bold">{metrics.callsToday}</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-muted/50">
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">This Month</p>
                            <p className="text-xl font-bold">{metrics.callsThisMonth}</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-muted/50">
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">All Time</p>
                            <p className="text-xl font-bold">{metrics.totalCalls}</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Current Charges</p>
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-muted-foreground">Estimated Total</p>
                              <p className="text-xl font-bold">
                                {formatCurrency(metrics.estimatedCharge, metrics.currency)}
                              </p>
                            </div>
                            <CreditCard className="h-6 w-6 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Billing Information</AlertTitle>
                      <AlertDescription>
                        You are charged only for successful geocoding requests. The final billing amount
                        will be calculated at the end of your billing cycle.
                      </AlertDescription>
                    </Alert>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No billing data available
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/geocode/metrics'] });
                  toast({
                    title: 'Refreshed',
                    description: 'Billing data has been refreshed.',
                  });
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Billing Data
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}