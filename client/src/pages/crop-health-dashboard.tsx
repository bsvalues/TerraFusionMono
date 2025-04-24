import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

import {
  HealthStatusCard,
  SoilAnalysisCard,
  DiseaseDetectionCard,
  YieldPredictionCard,
  WeatherForecastCard
} from "@/components/crop-health";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart4Icon, 
  RefreshCwIcon, 
  AlertTriangleIcon, 
  FolderOpenIcon,
  Leaf, // Replacing PlantIcon with Leaf
  SproutIcon 
} from "lucide-react";

export default function CropHealthDashboard() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  // In a real app, we would get this from URL params or context
  const [selectedParcelId, setSelectedParcelId] = useState<string>("parcel-123");
  
  // Fetch parcel list for dropdown
  const { data: parcels, isLoading: isLoadingParcels } = useQuery<any[]>({
    queryKey: ["/api/parcels"],
    retry: false,
    refetchOnWindowFocus: false,
    onError: (error: any) => {
      toast({
        title: "Error fetching parcels",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Fetch crop health data
  const { 
    data: healthData, 
    isLoading: isLoadingHealth,
    refetch: refetchHealth
  } = useQuery<any>({
    queryKey: ["/api/crop-health", selectedParcelId],
    enabled: !!selectedParcelId,
    retry: false,
    onError: (error: any) => {
      toast({
        title: "Error fetching crop health data",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Fetch soil analysis data
  const { 
    data: soilData, 
    isLoading: isLoadingSoil,
    refetch: refetchSoil
  } = useQuery<any>({
    queryKey: ["/api/crop-health/soil", selectedParcelId],
    enabled: !!selectedParcelId,
    retry: false,
    onError: (error: any) => {
      toast({
        title: "Error fetching soil analysis",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Fetch disease detection data
  const { 
    data: diseaseData, 
    isLoading: isLoadingDisease,
    refetch: refetchDisease
  } = useQuery<any>({
    queryKey: ["/api/crop-health/diseases", selectedParcelId],
    enabled: !!selectedParcelId,
    retry: false,
    onError: (error: any) => {
      toast({
        title: "Error fetching disease data",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Fetch yield prediction data
  const { 
    data: yieldData, 
    isLoading: isLoadingYield,
    refetch: refetchYield
  } = useQuery<any>({
    queryKey: ["/api/crop-health/yield", selectedParcelId],
    enabled: !!selectedParcelId,
    retry: false,
    onError: (error: any) => {
      toast({
        title: "Error fetching yield prediction",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Fetch weather data
  const { 
    data: weatherData, 
    isLoading: isLoadingWeather,
    refetch: refetchWeather
  } = useQuery<any>({
    queryKey: ["/api/crop-health/weather", selectedParcelId],
    enabled: !!selectedParcelId,
    retry: false,
    onError: (error: any) => {
      toast({
        title: "Error fetching weather data",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // To switch to demo mode if API fails or no data is available
  const [useDemoData, setUseDemoData] = useState<boolean>(false);
  
  // Demo data - only used if the API fails or no real data available
  const demoHealthData = {
    parcelId: "parcel-123",
    parcelName: "North Field",
    cropType: "corn",
    overallHealth: "good",
    healthScore: 82,
    lastUpdated: new Date().toISOString(),
    growthStage: "V6 - Six Leaf",
    daysToHarvest: 95,
    estimatedHarvestDate: "2025-07-15",
    alerts: [
      { type: "water", message: "Moderate water stress detected in northwestern section" },
      { type: "nutrient", message: "Minor nitrogen deficiency" }
    ]
  };
  
  const demoSoilData = {
    parcelId: "parcel-123",
    soilType: "loam",
    ph: 6.8,
    organicMatter: 3.2,
    nitrogenLevel: 42,
    phosphorusLevel: 28,
    potassiumLevel: 195,
    waterRetention: "good",
    deficiencies: [
      { nutrient: "magnesium", severity: "mild" }
    ],
    suitabilityScore: 87,
    timestamp: new Date().toISOString(),
    recommendations: [
      "Apply magnesium supplement at 15 lbs/acre",
      "Maintain current irrigation schedule"
    ]
  };
  
  const demoDiseaseData = {
    parcelId: "parcel-123",
    scanDate: new Date().toISOString(),
    cropType: "corn",
    detectedDiseases: [
      {
        name: "Northern Corn Leaf Blight",
        scientificName: "Exserohilum turcicum",
        severity: "low",
        spreadPercentage: 8,
        affectedAreas: ["northeastern corner"],
        symptoms: ["Long elliptical gray-green lesions", "Brown spots with yellow halos"],
        treatmentRecommendations: [
          "Apply foliar fungicide - Propiconazole",
          "Monitor spread every 3 days"
        ],
        images: [
          {
            url: "https://extension.umn.edu/sites/extension.umn.edu/files/styles/large/public/nclb.jpg",
            timestamp: new Date().toISOString(),
            location: "Section A, Northeast"
          }
        ]
      }
    ],
    riskAssessment: {
      spreadRisk: "moderate",
      economicImpact: "low",
      controlDifficulty: "easy"
    }
  };
  
  const demoYieldData = {
    parcelId: "parcel-123",
    cropType: "corn",
    predictedYield: {
      value: 175,
      unit: "bushels/acre"
    },
    confidenceInterval: {
      low: 162,
      high: 189
    },
    confidenceLevel: 0.95,
    scenarios: [
      {
        name: "Drought conditions",
        yieldChange: -23,
        probability: 0.15
      },
      {
        name: "Optimal conditions",
        yieldChange: 12,
        probability: 0.35
      },
      {
        name: "Heavy rainfall",
        yieldChange: -10,
        probability: 0.20
      }
    ],
    marketValueEstimate: {
      perUnit: 4.75,
      total: 5000 * 175 * 4.75, // assuming 5000 acres
      currency: "USD"
    },
    harvestDateEstimate: "2025-07-15",
    historicalYields: [
      { year: 2024, yield: 168 },
      { year: 2023, yield: 172 },
      { year: 2022, yield: 159 },
      { year: 2021, yield: 183 }
    ],
    lastUpdated: new Date().toISOString()
  };
  
  const demoWeatherData = {
    parcelId: "parcel-123",
    current: {
      temperature: 78,
      humidity: 65,
      precipitation: 0,
      windSpeed: 8,
      windDirection: 225,
      conditions: "Partly Cloudy",
      timestamp: new Date().toISOString()
    },
    forecast: [
      {
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        conditions: "Sunny",
        temperatureMin: 65,
        temperatureMax: 85,
        temperatureAvg: 75,
        precipitation: 0,
        humidity: 60,
        windSpeed: 5,
        windDirection: 180
      },
      {
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        conditions: "Partly Cloudy",
        temperatureMin: 68,
        temperatureMax: 88,
        temperatureAvg: 78,
        precipitation: 0,
        humidity: 65,
        windSpeed: 7,
        windDirection: 200
      },
      {
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        conditions: "Cloudy",
        temperatureMin: 70,
        temperatureMax: 84,
        temperatureAvg: 77,
        precipitation: 0.1,
        humidity: 75,
        windSpeed: 10,
        windDirection: 220
      },
      {
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        conditions: "Light Rain",
        temperatureMin: 65,
        temperatureMax: 78,
        temperatureAvg: 72,
        precipitation: 0.4,
        humidity: 85,
        windSpeed: 12,
        windDirection: 190
      },
      {
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        conditions: "Partly Cloudy",
        temperatureMin: 62,
        temperatureMax: 80,
        temperatureAvg: 71,
        precipitation: 0.1,
        humidity: 70,
        windSpeed: 8,
        windDirection: 210
      },
      {
        date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        conditions: "Sunny",
        temperatureMin: 66,
        temperatureMax: 84,
        temperatureAvg: 75,
        precipitation: 0,
        humidity: 55,
        windSpeed: 5,
        windDirection: 200
      },
      {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        conditions: "Sunny",
        temperatureMin: 68,
        temperatureMax: 86,
        temperatureAvg: 77,
        precipitation: 0,
        humidity: 50,
        windSpeed: 4,
        windDirection: 180
      }
    ],
    alerts: [],
    advisories: [
      {
        type: "irrigation",
        message: "Consider irrigation in the next 48 hours due to dry conditions"
      }
    ]
  };
  
  // Demo parcels for dropdown if API fails
  const demoParcels = [
    { id: "parcel-123", name: "North Field", acreage: 320, cropType: "corn" },
    { id: "parcel-456", name: "West Field", acreage: 240, cropType: "soybeans" },
    { id: "parcel-789", name: "South Field", acreage: 180, cropType: "wheat" }
  ];
  
  // Check if any data is missing and toggle demo mode if needed
  useEffect(() => {
    const isAnyDataMissing = 
      (!healthData && !isLoadingHealth) || 
      (!soilData && !isLoadingSoil) || 
      (!diseaseData && !isLoadingDisease) || 
      (!yieldData && !isLoadingYield) || 
      (!weatherData && !isLoadingWeather);
    
    if (isAnyDataMissing && !useDemoData) {
      toast({
        title: "Using demo data",
        description: "Some API endpoints didn't return data. Showing demo data instead.",
        variant: "default",
      });
      setUseDemoData(true);
    }
  }, [
    healthData, soilData, diseaseData, yieldData, weatherData,
    isLoadingHealth, isLoadingSoil, isLoadingDisease, isLoadingYield, isLoadingWeather
  ]);
  
  // Function to refresh all data
  const refreshAllData = () => {
    refetchHealth();
    refetchSoil();
    refetchDisease();
    refetchYield();
    refetchWeather();
    
    toast({
      title: "Refreshing data",
      description: "Fetching latest crop health data...",
    });
  };
  
  // Handle parcel selection change
  const handleParcelChange = (parcelId: string) => {
    setSelectedParcelId(parcelId);
    setUseDemoData(false); // Reset demo mode when switching parcels
  };
  
  // Determine which data to use (real or demo)
  const displayHealthData = useDemoData ? demoHealthData : healthData;
  const displaySoilData = useDemoData ? demoSoilData : soilData;
  const displayDiseaseData = useDemoData ? demoDiseaseData : diseaseData;
  const displayYieldData = useDemoData ? demoYieldData : yieldData;
  const displayWeatherData = useDemoData ? demoWeatherData : weatherData;
  const displayParcels = useDemoData ? demoParcels : parcels;
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Crop Health Dashboard</h1>
          <p className="text-muted-foreground">View comprehensive crop health analytics and predictions</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-[240px]">
            <Select 
              disabled={isLoadingParcels || !displayParcels} 
              value={selectedParcelId}
              onValueChange={handleParcelChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a parcel" />
              </SelectTrigger>
              <SelectContent>
                {displayParcels?.map((parcel) => (
                  <SelectItem key={parcel.id} value={parcel.id}>
                    {parcel.name} ({parcel.cropType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={refreshAllData}
            variant="outline"
            className="gap-2"
          >
            <RefreshCwIcon className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      {useDemoData && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangleIcon className="h-6 w-6 text-yellow-600" />
            <div>
              <h3 className="font-medium text-yellow-800">Demo Mode Active</h3>
              <p className="text-sm text-yellow-700">
                Showing demo data because some API endpoints didn't return data.
                This could be due to missing API keys or server connectivity issues.
                Contact your administrator for assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Health Status Card */}
        <div className="col-span-1">
          {isLoadingHealth && !displayHealthData ? (
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ) : displayHealthData ? (
            <HealthStatusCard
              parcelId={displayHealthData.parcelId}
              parcelName={displayHealthData.parcelName}
              cropType={displayHealthData.cropType}
              overallHealth={displayHealthData.overallHealth}
              healthScore={displayHealthData.healthScore}
              lastUpdated={displayHealthData.lastUpdated}
              growthStage={displayHealthData.growthStage}
              daysToHarvest={displayHealthData.daysToHarvest}
              estimatedHarvestDate={displayHealthData.estimatedHarvestDate}
              alerts={displayHealthData.alerts}
            />
          ) : (
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-60">
                <Leaf className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="font-medium">Health Data Unavailable</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                  Unable to retrieve crop health data for this parcel.
                </p>
                <Button variant="outline" size="sm" className="mt-4" onClick={refreshAllData}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Soil Analysis Card */}
        <div className="col-span-1">
          {isLoadingSoil && !displaySoilData ? (
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ) : displaySoilData ? (
            <SoilAnalysisCard
              parcelId={displaySoilData.parcelId}
              soilType={displaySoilData.soilType}
              ph={displaySoilData.ph}
              organicMatter={displaySoilData.organicMatter}
              nitrogenLevel={displaySoilData.nitrogenLevel}
              phosphorusLevel={displaySoilData.phosphorusLevel}
              potassiumLevel={displaySoilData.potassiumLevel}
              waterRetention={displaySoilData.waterRetention}
              deficiencies={displaySoilData.deficiencies}
              suitabilityScore={displaySoilData.suitabilityScore}
              timestamp={displaySoilData.timestamp}
              recommendations={displaySoilData.recommendations}
            />
          ) : (
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-60">
                <FolderOpenIcon className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="font-medium">Soil Analysis Unavailable</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                  Unable to retrieve soil analysis data for this parcel.
                </p>
                <Button variant="outline" size="sm" className="mt-4" onClick={refreshAllData}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Weather Forecast Card */}
        <div className="col-span-1">
          {isLoadingWeather && !displayWeatherData ? (
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ) : displayWeatherData ? (
            <WeatherForecastCard
              parcelId={displayWeatherData.parcelId}
              current={displayWeatherData.current}
              forecast={displayWeatherData.forecast}
              alerts={displayWeatherData.alerts}
              advisories={displayWeatherData.advisories}
            />
          ) : (
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-60">
                <BarChart4Icon className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="font-medium">Weather Data Unavailable</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                  Unable to retrieve weather data for this parcel.
                </p>
                <Button variant="outline" size="sm" className="mt-4" onClick={refreshAllData}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Disease Detection Card - Full width on medium screens */}
        <div className="col-span-1 md:col-span-2 xl:col-span-1">
          {isLoadingDisease && !displayDiseaseData ? (
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ) : displayDiseaseData ? (
            <DiseaseDetectionCard
              parcelId={displayDiseaseData.parcelId}
              scanDate={displayDiseaseData.scanDate}
              cropType={displayDiseaseData.cropType}
              detectedDiseases={displayDiseaseData.detectedDiseases}
              riskAssessment={displayDiseaseData.riskAssessment}
            />
          ) : (
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-60">
                <AlertTriangleIcon className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="font-medium">Disease Data Unavailable</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                  Unable to retrieve disease detection data for this parcel.
                </p>
                <Button variant="outline" size="sm" className="mt-4" onClick={refreshAllData}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Yield Prediction Card - Full width */}
        <div className="col-span-1 xl:col-span-2">
          {isLoadingYield && !displayYieldData ? (
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ) : displayYieldData ? (
            <YieldPredictionCard
              parcelId={displayYieldData.parcelId}
              cropType={displayYieldData.cropType}
              predictedYield={displayYieldData.predictedYield}
              confidenceInterval={displayYieldData.confidenceInterval}
              confidenceLevel={displayYieldData.confidenceLevel}
              scenarios={displayYieldData.scenarios}
              marketValueEstimate={displayYieldData.marketValueEstimate}
              harvestDateEstimate={displayYieldData.harvestDateEstimate}
              historicalYields={displayYieldData.historicalYields}
              lastUpdated={displayYieldData.lastUpdated}
            />
          ) : (
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-60">
                <BarChart4Icon className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="font-medium">Yield Prediction Unavailable</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                  Unable to retrieve yield prediction data for this parcel.
                </p>
                <Button variant="outline" size="sm" className="mt-4" onClick={refreshAllData}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}