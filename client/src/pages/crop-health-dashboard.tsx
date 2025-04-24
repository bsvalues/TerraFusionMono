import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  HealthStatusCard, 
  SoilAnalysisCard, 
  DiseaseDetectionPanel,
  YieldPredictionChart,
  WeatherForecast
} from "@/components/crop-health";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient } from "@/lib/queryClient";
import { Loader2, RefreshCw } from "lucide-react";

/**
 * Crop Health Dashboard Page
 * 
 * Comprehensive view of crop health analytics including soil analysis,
 * disease detection, yield prediction, and weather data
 */
export default function CropHealthDashboard() {
  const [selectedParcelId, setSelectedParcelId] = useState<string>("");
  
  // Fetch parcels for dropdown
  const { 
    data: parcels, 
    isLoading: isParcelsLoading,
    error: parcelsError
  } = useQuery({
    queryKey: ['/api/parcels'],
    placeholderData: []
  });
  
  // Set first parcel as default when data loads
  if (parcels?.length && !selectedParcelId) {
    setSelectedParcelId(parcels[0].externalId);
  }
  
  // Fetch crop health data for selected parcel
  const {
    data: cropHealthData,
    isLoading: isCropHealthLoading,
    error: cropHealthError
  } = useQuery({
    queryKey: ['/api/crop-health', selectedParcelId],
    enabled: !!selectedParcelId,
  });
  
  // Fetch soil analysis for selected parcel
  const {
    data: soilAnalysis,
    isLoading: isSoilLoading,
    error: soilError
  } = useQuery({
    queryKey: ['/api/crop-health/soil', selectedParcelId],
    enabled: !!selectedParcelId,
  });
  
  // Fetch disease detections for selected parcel
  const {
    data: diseaseDetections,
    isLoading: isDiseaseLoading,
    error: diseaseError
  } = useQuery({
    queryKey: ['/api/crop-health/diseases', selectedParcelId],
    enabled: !!selectedParcelId,
  });
  
  // Fetch yield prediction for selected parcel
  const {
    data: yieldPrediction,
    isLoading: isYieldLoading,
    error: yieldError
  } = useQuery({
    queryKey: ['/api/crop-health/yield', selectedParcelId],
    enabled: !!selectedParcelId,
  });
  
  // Fetch weather data for selected parcel
  const {
    data: weatherData,
    isLoading: isWeatherLoading,
    error: weatherError
  } = useQuery({
    queryKey: ['/api/crop-health/weather', selectedParcelId],
    enabled: !!selectedParcelId,
  });
  
  // Handle refresh button click
  const handleRefresh = () => {
    if (selectedParcelId) {
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/crop-health'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crop-health/soil', selectedParcelId] });
      queryClient.invalidateQueries({ queryKey: ['/api/crop-health/diseases', selectedParcelId] });
      queryClient.invalidateQueries({ queryKey: ['/api/crop-health/yield', selectedParcelId] });
      queryClient.invalidateQueries({ queryKey: ['/api/crop-health/weather', selectedParcelId] });
    }
  };
  
  // Handle parcel selection change
  const handleParcelChange = (value: string) => {
    setSelectedParcelId(value);
  };
  
  // Loading state for the entire page
  if (isParcelsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Error state for parcels load failure
  if (parcelsError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-destructive mb-2">Error loading parcels. Please try again.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/parcels'] })}>
          Retry
        </Button>
      </div>
    );
  }
  
  // No parcels available state
  if (!parcels?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-muted-foreground mb-2">No parcels found. Please add a parcel first.</p>
        <Button>Add Parcel</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crop Health Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor crop health, soil conditions, and yield predictions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedParcelId} onValueChange={handleParcelChange}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select parcel" />
            </SelectTrigger>
            <SelectContent>
              {parcels.map((parcel: any) => (
                <SelectItem key={parcel.externalId} value={parcel.externalId}>
                  {parcel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {!selectedParcelId ? (
        <div className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">Please select a parcel to view crop health data</p>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Health Status Card */}
            {isCropHealthLoading ? (
              <Skeleton className="h-[300px] rounded-xl" />
            ) : cropHealthData ? (
              <HealthStatusCard
                parcelId={selectedParcelId}
                parcelName={cropHealthData.parcelName}
                cropType={cropHealthData.cropType}
                overallHealth={cropHealthData.overallHealth}
                healthScore={cropHealthData.healthScore}
                lastUpdated={new Date(cropHealthData.analysisDate).toLocaleString()}
                growthStage={cropHealthData.growthPrediction.currentStage}
                daysToHarvest={cropHealthData.growthPrediction.daysToHarvest}
                estimatedHarvestDate={new Date(cropHealthData.growthPrediction.estimatedHarvestDate).toLocaleDateString()}
                alerts={cropHealthData.riskFactors.map((risk: any) => ({
                  type: risk.type,
                  message: risk.description
                }))}
              />
            ) : (
              <div className="border rounded-xl p-4 flex items-center justify-center">
                <p className="text-muted-foreground">Health data not available</p>
              </div>
            )}
            
            {/* Soil Analysis Card */}
            {isSoilLoading ? (
              <Skeleton className="h-[300px] rounded-xl" />
            ) : soilAnalysis ? (
              <SoilAnalysisCard
                parcelId={selectedParcelId}
                parcelName={parcels.find((p: any) => p.externalId === selectedParcelId)?.name}
                soilType={soilAnalysis.soilType}
                ph={soilAnalysis.ph}
                organicMatter={soilAnalysis.organicMatter}
                nutrients={{
                  nitrogen: soilAnalysis.nitrogenLevel,
                  phosphorus: soilAnalysis.phosphorusLevel,
                  potassium: soilAnalysis.potassiumLevel
                }}
                waterRetention={soilAnalysis.waterRetention}
                deficiencies={soilAnalysis.deficiencies || []}
                suitabilityScore={soilAnalysis.suitabilityScore}
                lastUpdated={new Date(soilAnalysis.timestamp).toLocaleString()}
              />
            ) : (
              <div className="border rounded-xl p-4 flex items-center justify-center">
                <p className="text-muted-foreground">Soil analysis not available</p>
              </div>
            )}
            
            {/* Weather Forecast Component */}
            {isWeatherLoading ? (
              <Skeleton className="h-[300px] rounded-xl" />
            ) : weatherData ? (
              <WeatherForecast 
                parcelId={selectedParcelId}
                parcelName={parcels.find((p: any) => p.externalId === selectedParcelId)?.name}
                currentWeather={weatherData.current}
                forecast={weatherData.forecast}
                lastUpdated={new Date(weatherData.current.timestamp).toLocaleString()}
              />
            ) : (
              <div className="border rounded-xl p-4 flex items-center justify-center">
                <p className="text-muted-foreground">Weather data not available</p>
              </div>
            )}
          </div>
          
          {/* Detailed Analysis Tabs */}
          <Tabs defaultValue="diseases" className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="diseases">Disease Detection & Analysis</TabsTrigger>
              <TabsTrigger value="yield">Yield Prediction</TabsTrigger>
            </TabsList>
            
            <TabsContent value="diseases" className="mt-6">
              {isDiseaseLoading ? (
                <Skeleton className="h-[500px] rounded-xl" />
              ) : diseaseDetections ? (
                <DiseaseDetectionPanel
                  parcelId={selectedParcelId}
                  parcelName={parcels.find((p: any) => p.externalId === selectedParcelId)?.name}
                  cropType={cropHealthData?.cropType || "Unknown"}
                  detectedDiseases={diseaseDetections.detectedDiseases || []}
                  onUploadImage={(file) => {
                    // Handle image upload for disease analysis
                    console.log("Uploading file for analysis", file);
                  }}
                />
              ) : (
                <div className="border rounded-xl p-4 flex items-center justify-center">
                  <p className="text-muted-foreground">Disease detection data not available</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="yield" className="mt-6">
              {isYieldLoading ? (
                <Skeleton className="h-[500px] rounded-xl" />
              ) : yieldPrediction ? (
                <YieldPredictionChart
                  parcelId={selectedParcelId}
                  parcelName={parcels.find((p: any) => p.externalId === selectedParcelId)?.name}
                  cropType={cropHealthData?.cropType || "Unknown"}
                  baseYield={yieldPrediction.predictedYield.value}
                  yieldUnit={yieldPrediction.predictedYield.unit}
                  confidenceLow={yieldPrediction.confidenceInterval.low}
                  confidenceHigh={yieldPrediction.confidenceInterval.high}
                  confidenceLevel={yieldPrediction.confidenceLevel}
                  scenarios={yieldPrediction.scenarios || []}
                  marketValuePerUnit={yieldPrediction.marketValueEstimate.perUnit}
                  harvestDate={new Date(yieldPrediction.harvestDateEstimate).toLocaleDateString()}
                  lastUpdated={new Date().toLocaleString()}
                  historicalYields={yieldPrediction.historicalYields || []}
                />
              ) : (
                <div className="border rounded-xl p-4 flex items-center justify-center">
                  <p className="text-muted-foreground">Yield prediction data not available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}