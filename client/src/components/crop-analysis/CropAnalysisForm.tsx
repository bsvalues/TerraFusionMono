import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useWebSocketSubscription } from '@/lib/websocket';

type AnalysisResult = {
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
};

type ApiResponse = {
  success: boolean;
  analysis: AnalysisResult;
  usedFallback: boolean;
  analysisId?: string;
};

type WebSocketUpdateData = {
  type: string;
  status: 'processing' | 'completed' | 'error';
  progress?: number;
  analysisId?: string;
  result?: ApiResponse;
  error?: string;
};

const CropAnalysisForm = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parcelId, setParcelId] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);

  // Set up WebSocket subscription for real-time updates
  useWebSocketSubscription({
    channel: 'crop_analysis',
    onMessage: (data: WebSocketUpdateData) => {
      // Only process updates for the current analysis
      if (data.analysisId && data.analysisId === currentAnalysisId) {
        console.log('Received WebSocket update:', data);

        if (data.status === 'processing') {
          // Update progress
          setAnalysisProgress(data.progress || 0);
          
          // Show progress notification
          if (data.progress && data.progress % 25 === 0) {
            toast({
              title: 'Analysis in Progress',
              description: `Processing: ${data.progress}% complete`,
              variant: 'default',
            });
          }
        } else if (data.status === 'completed' && data.result) {
          // Analysis completed - update state
          setLoading(false);
          setAnalysisProgress(100);
          setResult(data.result);
          
          // Show success notification
          toast({
            title: 'Analysis Complete',
            description: `Crop analysis completed successfully`,
            variant: 'default',
          });
        } else if (data.status === 'error') {
          // Analysis failed - show error
          setLoading(false);
          setError(data.error || 'An error occurred during analysis');
          
          toast({
            title: 'Analysis Failed',
            description: data.error || 'An error occurred during analysis',
            variant: 'destructive',
          });
        }
      }
    }
  });

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select an image file for analysis');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    setAnalysisProgress(5); // Start with a small progress indication
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      if (parcelId) formData.append('parcelId', parcelId);
      if (latitude) formData.append('latitude', latitude);
      if (longitude) formData.append('longitude', longitude);
      if (notes) formData.append('notes', notes);
      
      const response = await axios.post<ApiResponse>('/api/crop-analysis/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.analysisId) {
        // Store the analysis ID to filter WebSocket messages
        setCurrentAnalysisId(response.data.analysisId);
        
        // For long-running analyses, we'll get updates via WebSocket
        if (!response.data.analysis) {
          toast({
            title: 'Analysis Started',
            description: 'Your crop image is being analyzed. You will receive real-time updates on the progress.',
            variant: 'default',
          });
          setAnalysisProgress(10); // Bump up progress slightly
        } else {
          // For quick analyses that complete immediately
          setResult(response.data);
          setLoading(false);
        }
      } else {
        // If no analysis ID is returned, treat as immediate result
        setResult(response.data);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error analyzing crop:', error);
      setError(error.response?.data?.error || 'An error occurred during analysis');
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

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return 'bg-green-100 text-green-800';
    if (severity <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Crop Health Analysis</CardTitle>
          <CardDescription>
            Upload an image of your crops for AI-powered health analysis and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="image">Crop Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              
              {previewUrl && (
                <div className="mt-4 border rounded-md overflow-hidden max-w-md">
                  <img 
                    src={previewUrl} 
                    alt="Crop preview" 
                    className="w-full h-auto object-cover" 
                  />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parcelId">Parcel ID (Optional)</Label>
                <Input
                  id="parcelId"
                  type="text"
                  value={parcelId}
                  onChange={(e) => setParcelId(e.target.value)}
                  placeholder="Enter field or parcel identifier"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude (Optional)</Label>
                <Input
                  id="latitude"
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 37.7749"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude (Optional)</Label>
                <Input
                  id="longitude"
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. -122.4194"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full md:w-auto"
              disabled={loading || !file}
            >
              {loading ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : 'Analyze Crop Health'}
            </Button>
          </form>
          
          {loading && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <p>Analysis in progress... Please wait</p>
                <p>{analysisProgress}%</p>
              </div>
              <Progress value={analysisProgress} />
              <p className="text-xs text-gray-500">
                Receiving real-time updates via WebSocket
              </p>
            </div>
          )}
          
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
              Analysis Results
              {result.usedFallback && (
                <span className="text-sm font-normal text-amber-500 bg-amber-50 px-2 py-1 rounded-md">
                  Using Fallback Data
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Crop Type: <span className="font-medium">{result.analysis.cropType}</span> | 
              Health: <span className={`font-medium ${getHealthStatusColor(result.analysis.healthStatus)}`}>
                {result.analysis.healthStatus.charAt(0).toUpperCase() + result.analysis.healthStatus.slice(1)}
              </span> | 
              Confidence: <span className="font-medium">{Math.round(result.analysis.confidenceScore * 100)}%</span>
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
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
                        <p className="text-sm font-medium text-gray-500">Crop Type</p>
                        <p className="text-lg font-semibold">{result.analysis.cropType}</p>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <p className="text-sm font-medium text-gray-500">Health Status</p>
                        <p className={`text-lg font-semibold ${getHealthStatusColor(result.analysis.healthStatus)}`}>
                          {result.analysis.healthStatus.charAt(0).toUpperCase() + result.analysis.healthStatus.slice(1)}
                        </p>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <p className="text-sm font-medium text-gray-500">Issues Detected</p>
                        <p className="text-lg font-semibold">{result.analysis.issues.length}</p>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <p className="text-sm font-medium text-gray-500">Confidence Score</p>
                        <p className="text-lg font-semibold">{Math.round(result.analysis.confidenceScore * 100)}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="issues">
                <div className="space-y-4">
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
                      <p className="text-gray-500">No issues detected</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="recommendations">
                <div className="space-y-4">
                  {result.analysis.issues.flatMap((issue, issueIndex) => 
                    issue.recommendedActions.map((action, actionIndex) => (
                      <div key={`${issueIndex}-${actionIndex}`} className="flex items-start gap-2">
                        <div className="mt-1 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-800 text-xs font-medium">{issueIndex + 1}</span>
                        </div>
                        <div>
                          <p className="text-gray-800">{action}</p>
                          <p className="text-xs text-gray-500 mt-1">For issue: {issue.name}</p>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {result.analysis.issues.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No recommendations available</p>
                    </div>
                  )}
                </div>
              </TabsContent>
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

export default CropAnalysisForm;