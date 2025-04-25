import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderCircle, CheckCircle2, AlertCircle, Info, Map, Thermometer, Droplets } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type AdvancedAnalysisResult = {
  cropType: string;
  healthStatus: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
  issues: Array<{
    name: string;
    description: string;
    severity: number;
    recommendedActions: string[];
  }>;
  overallAssessment: string;
  confidenceScore: number;
  growthStage: string;
  nutritionalStatus: {
    overall: 'optimal' | 'adequate' | 'deficient' | 'toxic';
    deficiencies: Array<{
      nutrient: string;
      severity: 'mild' | 'moderate' | 'severe';
      symptoms: string[];
      corrections: string[];
    }>;
  };
  estimatedYield: {
    prediction: string;
    optimisticScenario: string;
    pessimisticScenario: string;
    confidenceLevel: number;
  };
  diseaseRisk: {
    currentRisks: Array<{
      diseaseName: string;
      likelihood: number;
      impact: 'low' | 'medium' | 'high';
      preventativeMeasures: string[];
    }>;
  };
  temporalChanges?: {
    comparedToPrevious: string;
    trendAnalysis: string;
    keyChanges: string[];
  };
  regionSpecificInsights?: string[];
};

type ApiResponse = {
  success: boolean;
  analysis: AdvancedAnalysisResult;
  usedFallback: boolean;
};

const AdvancedAnalysisForm = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [cropType, setCropType] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [elevation, setElevation] = useState('');
  const [region, setRegion] = useState('');
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [rainfall, setRainfall] = useState('');
  const [recentRainfall, setRecentRainfall] = useState('');
  const [soilType, setSoilType] = useState('');
  const [soilPH, setSoilPH] = useState('');
  const [soilOrganicMatter, setSoilOrganicMatter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    setFiles(selectedFiles);
    
    if (selectedFiles && selectedFiles.length > 0) {
      const urls: string[] = [];
      Array.from(selectedFiles).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          urls.push(reader.result as string);
          if (urls.length === selectedFiles.length) {
            setPreviewUrls(urls);
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      setPreviewUrls([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!files || files.length === 0) {
      setError('Please select at least one image file for analysis');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const formData = new FormData();
      
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });
      
      if (cropType) formData.append('cropType', cropType);
      if (latitude) formData.append('latitude', latitude);
      if (longitude) formData.append('longitude', longitude);
      if (elevation) formData.append('elevation', elevation);
      if (region) formData.append('region', region);
      if (temperature) formData.append('temperature', temperature);
      if (humidity) formData.append('humidity', humidity);
      if (rainfall) formData.append('rainfall', rainfall);
      if (recentRainfall) formData.append('recentRainfall', recentRainfall);
      if (soilType) formData.append('soilType', soilType);
      if (soilPH) formData.append('soilPH', soilPH);
      if (soilOrganicMatter) formData.append('soilOrganicMatter', soilOrganicMatter);
      
      const response = await axios.post<ApiResponse>('/api/crop-analysis/advanced-analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setResult(response.data);
    } catch (error: any) {
      console.error('Error analyzing crop:', error);
      setError(error.response?.data?.error || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-green-500';
      case 'moderate': return 'text-yellow-500';
      case 'poor': return 'text-orange-500';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getNutritionalStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-green-600';
      case 'adequate': return 'text-green-500';
      case 'deficient': return 'text-amber-500';
      case 'toxic': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return 'bg-green-100 text-green-800';
    if (severity <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getLikelihoodColor = (likelihood: number) => {
    if (likelihood <= 0.3) return 'bg-green-100 text-green-800';
    if (likelihood <= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Advanced Crop Analysis</CardTitle>
          <CardDescription>
            Upload multiple images of your crops along with detailed environmental data for comprehensive analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="images">Crop Images (Multiple)</Label>
              <Input
                id="images"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer"
                multiple
              />
              
              {previewUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="border rounded-md overflow-hidden">
                      <img 
                        src={url} 
                        alt={`Crop preview ${index + 1}`} 
                        className="w-full h-40 object-cover" 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="crop-info">
                <AccordionTrigger className="text-base font-medium">Crop Information</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="cropType">Crop Type (if known)</Label>
                      <Input
                        id="cropType"
                        type="text"
                        value={cropType}
                        onChange={(e) => setCropType(e.target.value)}
                        placeholder="e.g. Corn, Wheat, Soybean"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="location">
                <AccordionTrigger className="text-base font-medium">Location Data</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="text"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="e.g. 37.7749"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="text"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="e.g. -122.4194"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="elevation">Elevation (meters)</Label>
                      <Input
                        id="elevation"
                        type="text"
                        value={elevation}
                        onChange={(e) => setElevation(e.target.value)}
                        placeholder="e.g. 25"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Input
                        id="region"
                        type="text"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder="e.g. California Central Valley"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="weather">
                <AccordionTrigger className="text-base font-medium">Weather Conditions</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature (°C)</Label>
                      <Input
                        id="temperature"
                        type="text"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        placeholder="e.g. 25"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="humidity">Humidity (%)</Label>
                      <Input
                        id="humidity"
                        type="text"
                        value={humidity}
                        onChange={(e) => setHumidity(e.target.value)}
                        placeholder="e.g. 65"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rainfall">Recent Rainfall (mm)</Label>
                      <Input
                        id="rainfall"
                        type="text"
                        value={rainfall}
                        onChange={(e) => setRainfall(e.target.value)}
                        placeholder="e.g. 10.5"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="recentRainfall">Rainfall Pattern</Label>
                      <Input
                        id="recentRainfall"
                        type="text"
                        value={recentRainfall}
                        onChange={(e) => setRecentRainfall(e.target.value)}
                        placeholder="e.g. Moderate rainfall last week"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="soil">
                <AccordionTrigger className="text-base font-medium">Soil Properties</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="soilType">Soil Type</Label>
                      <Input
                        id="soilType"
                        type="text"
                        value={soilType}
                        onChange={(e) => setSoilType(e.target.value)}
                        placeholder="e.g. Clay loam, Sandy"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="soilPH">Soil pH</Label>
                      <Input
                        id="soilPH"
                        type="text"
                        value={soilPH}
                        onChange={(e) => setSoilPH(e.target.value)}
                        placeholder="e.g. 6.8"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="soilOrganicMatter">Organic Matter (%)</Label>
                      <Input
                        id="soilOrganicMatter"
                        type="text"
                        value={soilOrganicMatter}
                        onChange={(e) => setSoilOrganicMatter(e.target.value)}
                        placeholder="e.g. 3.5"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Button 
              type="submit" 
              className="w-full md:w-auto"
              disabled={loading || !files || files.length === 0}
            >
              {loading ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Processing Advanced Analysis...
                </>
              ) : 'Run Advanced Analysis'}
            </Button>
          </form>
          
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {result && (
        <Card className="w-full mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Advanced Analysis Results
              {result.usedFallback && (
                <span className="text-sm font-normal text-amber-500 bg-amber-50 px-2 py-1 rounded-md">
                  Using Fallback Data
                </span>
              )}
            </CardTitle>
            <CardDescription>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                <span>
                  <span className="font-medium">Crop:</span> {result.analysis.cropType}
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  <span className="font-medium">Health:</span> 
                  <span className={`${getHealthStatusColor(result.analysis.healthStatus)}`}>
                    {result.analysis.healthStatus.charAt(0).toUpperCase() + result.analysis.healthStatus.slice(1)}
                  </span>
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  <span className="font-medium">Stage:</span> {result.analysis.growthStage}
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  <span className="font-medium">Confidence:</span> {Math.round(result.analysis.confidenceScore * 100)}%
                </span>
              </div>
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                <TabsTrigger value="yield">Yield Prediction</TabsTrigger>
                <TabsTrigger value="disease">Disease Risk</TabsTrigger>
                {result.analysis.temporalChanges && (
                  <TabsTrigger value="temporal">Temporal Changes</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="overview">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Overall Assessment</h4>
                    <p className="mt-1">{result.analysis.overallAssessment}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Summary</h4>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-md p-4">
                        <div className="flex items-center space-x-2">
                          <Info className="h-4 w-4 text-blue-500" />
                          <p className="text-sm font-medium text-gray-500">Crop Type</p>
                        </div>
                        <p className="text-lg font-semibold mt-1">{result.analysis.cropType}</p>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <div className="flex items-center space-x-2">
                          <Info className="h-4 w-4 text-blue-500" />
                          <p className="text-sm font-medium text-gray-500">Growth Stage</p>
                        </div>
                        <p className="text-lg font-semibold mt-1">{result.analysis.growthStage}</p>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <div className="flex items-center space-x-2">
                          <Map className="h-4 w-4 text-green-500" />
                          <p className="text-sm font-medium text-gray-500">Health Status</p>
                        </div>
                        <p className={`text-lg font-semibold mt-1 ${getHealthStatusColor(result.analysis.healthStatus)}`}>
                          {result.analysis.healthStatus.charAt(0).toUpperCase() + result.analysis.healthStatus.slice(1)}
                        </p>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <div className="flex items-center space-x-2">
                          <Droplets className="h-4 w-4 text-blue-500" />
                          <p className="text-sm font-medium text-gray-500">Nutritional Status</p>
                        </div>
                        <p className={`text-lg font-semibold mt-1 ${getNutritionalStatusColor(result.analysis.nutritionalStatus.overall)}`}>
                          {result.analysis.nutritionalStatus.overall.charAt(0).toUpperCase() + result.analysis.nutritionalStatus.overall.slice(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Issues Detected</h4>
                    <div className="space-y-3">
                      {result.analysis.issues.length > 0 ? (
                        result.analysis.issues.map((issue, index) => (
                          <div key={index} className="border rounded-md p-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-base font-semibold">{issue.name}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                                Severity: {issue.severity}/10
                              </span>
                            </div>
                            <p className="mt-2 text-gray-600">{issue.description}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-gray-500">No significant issues detected</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {result.analysis.regionSpecificInsights && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Region-Specific Insights</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {result.analysis.regionSpecificInsights.map((insight, index) => (
                            <li key={index} className="text-gray-700">{insight}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="nutrition">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Overall Nutritional Status</h4>
                    <p className={`text-lg font-semibold mt-1 ${getNutritionalStatusColor(result.analysis.nutritionalStatus.overall)}`}>
                      {result.analysis.nutritionalStatus.overall.charAt(0).toUpperCase() + result.analysis.nutritionalStatus.overall.slice(1)}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Nutrient Deficiencies</h4>
                    <div className="space-y-4">
                      {result.analysis.nutritionalStatus.deficiencies.length > 0 ? (
                        result.analysis.nutritionalStatus.deficiencies.map((deficiency, index) => (
                          <div key={index} className="border rounded-md p-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-base font-semibold">{deficiency.nutrient}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                deficiency.severity === 'mild' ? 'bg-yellow-100 text-yellow-800' :
                                deficiency.severity === 'moderate' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {deficiency.severity.charAt(0).toUpperCase() + deficiency.severity.slice(1)}
                              </span>
                            </div>
                            
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-500">Symptoms</p>
                              <ul className="mt-1 list-disc pl-5 space-y-1">
                                {deficiency.symptoms.map((symptom, sIndex) => (
                                  <li key={sIndex} className="text-gray-700">{symptom}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-500">Corrections</p>
                              <ul className="mt-1 list-disc pl-5 space-y-1">
                                {deficiency.corrections.map((correction, cIndex) => (
                                  <li key={cIndex} className="text-gray-700">{correction}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-green-600">No significant nutrient deficiencies detected</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="yield">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Yield Prediction</h4>
                    <p className="mt-1 text-lg">{result.analysis.estimatedYield.prediction}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-4">
                      <p className="text-sm font-medium text-gray-500">Optimistic Scenario</p>
                      <p className="mt-1 text-green-600">{result.analysis.estimatedYield.optimisticScenario}</p>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <p className="text-sm font-medium text-gray-500">Pessimistic Scenario</p>
                      <p className="mt-1 text-amber-600">{result.analysis.estimatedYield.pessimisticScenario}</p>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <p className="text-sm font-medium text-gray-500">Confidence Level</p>
                    <div className="mt-2 relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-200 text-blue-800">
                            {Math.round(result.analysis.estimatedYield.confidenceLevel * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                        <div style={{ width: `${Math.round(result.analysis.estimatedYield.confidenceLevel * 100)}%` }} 
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500">
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="disease">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Disease Risk Assessment</h4>
                    <div className="space-y-4">
                      {result.analysis.diseaseRisk.currentRisks.length > 0 ? (
                        result.analysis.diseaseRisk.currentRisks.map((risk, index) => (
                          <div key={index} className="border rounded-md p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="text-base font-semibold">{risk.diseaseName}</h4>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLikelihoodColor(risk.likelihood)}`}>
                                  Likelihood: {Math.round(risk.likelihood * 100)}%
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(risk.impact)}`}>
                                  Impact: {risk.impact.charAt(0).toUpperCase() + risk.impact.slice(1)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-500">Preventative Measures</p>
                              <ul className="mt-1 list-disc pl-5 space-y-1">
                                {risk.preventativeMeasures.map((measure, mIndex) => (
                                  <li key={mIndex} className="text-gray-700">{measure}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-green-600">No significant disease risks identified</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {result.analysis.temporalChanges && (
                <TabsContent value="temporal">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Comparison to Previous Analysis</h4>
                      <p className="mt-1">{result.analysis.temporalChanges.comparedToPrevious}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Trend Analysis</h4>
                      <p className="mt-1">{result.analysis.temporalChanges.trendAnalysis}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Key Changes</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {result.analysis.temporalChanges.keyChanges.map((change, index) => (
                          <li key={index} className="text-gray-700">{change}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-4">
            <p className="text-xs text-gray-500">
              Analysis Timestamp: {new Date().toLocaleString()}
            </p>
            {result.usedFallback && (
              <p className="text-xs text-amber-600">
                Note: Using fallback data due to API limitations
              </p>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default AdvancedAnalysisForm;