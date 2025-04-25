import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWebSocketSubscription } from '@/lib/websocket';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Loader2, 
  Upload, 
  Camera, 
  Leaf, 
  AlertTriangle, 
  Check, 
  Info, 
  BarChart4, 
  Clock, 
  Activity 
} from 'lucide-react';

interface CropAnalysisResult {
  id: string;
  timestamp: string;
  cropType: string;
  healthStatus: string;
  overallHealth: number;
  issues: Array<{
    name: string;
    description: string;
    severity: number;
    affectedArea: number;
    detectionConfidence: number;
    recommendedActions: string[];
  }>;
  confidenceScore: number;
  imageUrl: string;
  analyzedBy: string;
}

export default function CropAnalysisPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('recent');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentAnalysis, setCurrentAnalysis] = useState<CropAnalysisResult | null>(null);
  
  // Fetch recent analyses using React Query
  const { 
    data: recentAnalyses, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['/api/crop-health'],
    enabled: activeTab === 'recent'
  });
  
  // Set up WebSocket subscription for real-time updates
  useWebSocketSubscription({
    channel: 'crop_analysis',
    onMessage: (data) => {
      // Handle real-time updates for crop analysis
      if (data.status === 'processing') {
        // Update progress
        setAnalysisProgress(data.progress || 0);
      } else if (data.status === 'completed') {
        // Analysis completed - update state
        setIsAnalyzing(false);
        setAnalysisProgress(100);
        setCurrentAnalysis(data.result);
        
        // Show success notification
        toast({
          title: 'Analysis Complete',
          description: `Crop analysis for ${data.result.cropType} completed successfully.`,
          variant: 'default',
        });
        
        // Refresh the recent analyses list
        refetch();
      } else if (data.status === 'error') {
        // Analysis failed - show error
        setIsAnalyzing(false);
        
        toast({
          title: 'Analysis Failed',
          description: data.error || 'An error occurred during analysis.',
          variant: 'destructive',
        });
      }
    }
  });
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Reset analysis states
      setCurrentAnalysis(null);
      setAnalysisProgress(0);
    }
  };
  
  // Submit image for analysis
  const handleSubmitAnalysis = async () => {
    if (!selectedFile) {
      toast({
        title: 'No Image Selected',
        description: 'Please select an image to analyze.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisProgress(5); // Start progress
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('cropType', 'auto'); // Auto-detect crop type
      
      // Send for analysis
      const response = await fetch('/api/crop-analysis/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Analysis request failed');
      }
      
      const result = await response.json();
      
      // Set initial progress - the real updates will come over WebSocket
      setAnalysisProgress(15);
      
      // Success notification
      toast({
        title: 'Analysis Started',
        description: 'Your image is being analyzed. You\'ll receive real-time updates.',
        variant: 'default',
      });
      
    } catch (error) {
      console.error('Error submitting analysis:', error);
      setIsAnalyzing(false);
      
      toast({
        title: 'Submission Failed',
        description: 'Unable to submit image for analysis. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
  // Get health status color
  const getHealthStatusColor = (status: string): string => {
    const statusMap: Record<string, string> = {
      'EXCELLENT': 'bg-green-500',
      'GOOD': 'bg-green-400',
      'MODERATE': 'bg-yellow-400',
      'POOR': 'bg-orange-500',
      'CRITICAL': 'bg-red-500',
    };
    
    return statusMap[status] || 'bg-gray-400';
  };
  
  // Get severity level display
  const getSeverityDisplay = (level: number): { color: string, text: string } => {
    if (level >= 8) return { color: 'text-red-500', text: 'Severe' };
    if (level >= 6) return { color: 'text-orange-500', text: 'High' };
    if (level >= 4) return { color: 'text-yellow-500', text: 'Moderate' };
    return { color: 'text-green-500', text: 'Low' };
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Crop Health Analysis</h1>
      </div>
      
      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upload">Upload New Image</TabsTrigger>
          <TabsTrigger value="recent">Recent Analyses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <Card className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Upload Image for Analysis</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <label 
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center cursor-pointer h-40"
                  >
                    {!previewUrl ? (
                      <>
                        <Upload className="h-8 w-8 mb-2 text-gray-500" />
                        <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                      </>
                    ) : (
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-40 max-w-full object-contain" 
                      />
                    )}
                  </label>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    {selectedFile && (
                      <p className="text-sm text-gray-500">{selectedFile.name}</p>
                    )}
                  </div>
                  <Button
                    onClick={handleSubmitAnalysis}
                    disabled={!selectedFile || isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-4 w-4" />
                        Analyze Image
                      </>
                    )}
                  </Button>
                </div>
                
                {isAnalyzing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Analysis in progress...</span>
                      <span>{analysisProgress}%</span>
                    </div>
                    <Progress value={analysisProgress} />
                  </div>
                )}
              </div>
              
              <div>
                {currentAnalysis ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Leaf className="mr-2 h-5 w-5 text-green-500" />
                      Analysis Results
                    </h3>
                    
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-3 h-3 rounded-full ${getHealthStatusColor(currentAnalysis.healthStatus)}`}></div>
                      <span className="font-medium">{currentAnalysis.healthStatus}</span>
                      <span className="text-gray-500">|</span>
                      <span>Health Score: {currentAnalysis.overallHealth}/100</span>
                    </div>
                    
                    <div className="space-y-3 mt-4">
                      <h4 className="font-medium">Detected Issues:</h4>
                      {currentAnalysis.issues.length === 0 ? (
                        <p className="text-sm text-gray-500">No issues detected</p>
                      ) : (
                        <div className="space-y-2">
                          {currentAnalysis.issues.map((issue, index) => {
                            const severity = getSeverityDisplay(issue.severity);
                            return (
                              <Alert key={index} variant={issue.severity > 6 ? 'destructive' : 'default'}>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle className="flex items-center">
                                  {issue.name}
                                  <span className={`ml-2 text-sm ${severity.color}`}>
                                    ({severity.text})
                                  </span>
                                </AlertTitle>
                                <AlertDescription className="text-sm">
                                  {issue.description}
                                </AlertDescription>
                              </Alert>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-500 mt-4">
                      <p>Analyzed with {currentAnalysis.confidenceScore * 100}% confidence</p>
                      <p>Model: {currentAnalysis.analyzedBy}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 text-center text-gray-500">
                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <Leaf className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">No Analysis Results</h3>
                      <p className="text-sm">Upload and analyze an image to see results here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="recent" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load recent analyses. Please try again.
              </AlertDescription>
            </Alert>
          ) : recentAnalyses?.length === 0 ? (
            <div className="text-center p-6">
              <Info className="h-10 w-10 mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-medium">No Recent Analyses</h3>
              <p className="text-gray-500">Upload your first image to get started.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentAnalyses?.map((analysis: CropAnalysisResult) => (
                <Card key={analysis.id} className="overflow-hidden">
                  <div className="h-40 overflow-hidden">
                    {analysis.imageUrl ? (
                      <img 
                        src={analysis.imageUrl} 
                        alt={`${analysis.cropType}`} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Leaf className="h-10 w-10 text-gray-300" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{analysis.cropType}</h3>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        getHealthStatusColor(analysis.healthStatus)
                      } text-white`}>
                        {analysis.healthStatus}
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(analysis.timestamp).toLocaleDateString()}
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <Activity className="h-4 w-4 mr-1 text-blue-500" />
                        <span className="text-sm">Health: {analysis.overallHealth}/100</span>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {analysis.issues.length} {analysis.issues.length === 1 ? 'issue' : 'issues'}
                      </div>
                    </div>
                    
                    <Button variant="outline" className="w-full mt-3" size="sm">
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}