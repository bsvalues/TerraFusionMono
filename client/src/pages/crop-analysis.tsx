import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Upload, 
  ImagePlus, 
  Leaf, 
  Check, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type HealthStatus = 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';

interface CropHealthIssue {
  name: string;
  description: string;
  severity: number;
  recommendedActions: string[];
}

interface AnalysisResult {
  cropType: string;
  healthStatus: HealthStatus;
  issues: CropHealthIssue[];
  overallAssessment: string;
  confidenceScore: number;
}

interface AnalysisResponse {
  success: boolean;
  analysis: AnalysisResult;
}

const CropAnalysisPage: React.FC = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [saveToParcel, setSaveToParcel] = useState<boolean>(false);
  const [parcelId, setParcelId] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Mutation for analyzing crop image
  const { mutate: analyzeImage, isPending } = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error('No file selected');
      }
      
      const formData = new FormData();
      formData.append('image', file);
      
      if (notes) formData.append('notes', notes);
      if (saveToParcel && parcelId) formData.append('parcelId', parcelId);
      if (latitude && !isNaN(parseFloat(latitude))) formData.append('latitude', latitude);
      if (longitude && !isNaN(parseFloat(longitude))) formData.append('longitude', longitude);
      
      const response = await fetch('/api/crop-analysis/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error analyzing image');
      }
      
      return response.json() as Promise<AnalysisResponse>;
    },
    onSuccess: (data) => {
      setAnalysisResult(data.analysis);
      toast({
        title: 'Analysis Complete',
        description: `Successfully analyzed ${data.analysis.cropType} crop`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Helper to determine card color based on health status
  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'excellent': return 'bg-green-50 border-green-200';
      case 'good': return 'bg-emerald-50 border-emerald-200';
      case 'moderate': return 'bg-yellow-50 border-yellow-200';
      case 'poor': return 'bg-orange-50 border-orange-200';
      case 'critical': return 'bg-red-50 border-red-200';
      default: return '';
    }
  };

  // Helper to render badge by health status
  const getStatusBadge = (status: HealthStatus) => {
    switch (status) {
      case 'excellent': return <Badge variant="outline" className="bg-green-100 text-green-800">Excellent</Badge>;
      case 'good': return <Badge variant="outline" className="bg-emerald-100 text-emerald-800">Good</Badge>;
      case 'moderate': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Moderate</Badge>;
      case 'poor': return <Badge variant="outline" className="bg-orange-100 text-orange-800">Poor</Badge>;
      case 'critical': return <Badge variant="outline" className="bg-red-100 text-red-800">Critical</Badge>;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1 space-y-4">
          <h1 className="text-2xl font-bold">Crop Health Analysis</h1>
          <p className="text-gray-500">
            Upload an image of a crop to analyze its health status and receive recommendations.
          </p>
          
          <Card>
            <CardHeader>
              <CardTitle>Upload Crop Image</CardTitle>
              <CardDescription>
                Select a clear image of the crop for the best analysis results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="crop-image">Crop Image</Label>
                <Input 
                  id="crop-image" 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isPending}
                />
              </div>
              
              {previewUrl && (
                <div className="mt-4">
                  <Label>Preview</Label>
                  <div className="mt-1 relative rounded-md overflow-hidden border border-gray-200 h-48">
                    <img 
                      src={previewUrl} 
                      alt="Crop preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              
              <div className="grid w-full gap-1.5">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Add any notes about the crop or growing conditions"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isPending}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="save-to-parcel" 
                  checked={saveToParcel}
                  onCheckedChange={setSaveToParcel}
                  disabled={isPending}
                />
                <Label htmlFor="save-to-parcel">Save to parcel record</Label>
              </div>
              
              {saveToParcel && (
                <div className="grid w-full gap-4">
                  <div>
                    <Label htmlFor="parcel-id">Parcel ID</Label>
                    <Input 
                      id="parcel-id" 
                      placeholder="Enter parcel identifier"
                      value={parcelId}
                      onChange={(e) => setParcelId(e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latitude">Latitude (Optional)</Label>
                      <Input 
                        id="latitude" 
                        placeholder="e.g. 37.7749"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitude">Longitude (Optional)</Label>
                      <Input 
                        id="longitude" 
                        placeholder="e.g. -122.4194"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => analyzeImage()}
                disabled={!file || isPending}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Leaf className="mr-2 h-4 w-4" />
                    Analyze Crop Health
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="flex-1">
          {analysisResult ? (
            <Card className={`${getStatusColor(analysisResult.healthStatus)}`}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Analysis Results</CardTitle>
                  {getStatusBadge(analysisResult.healthStatus)}
                </div>
                <CardDescription>
                  {analysisResult.cropType} - Confidence: {(analysisResult.confidenceScore * 100).toFixed(0)}%
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Overall Assessment</h3>
                  <p className="text-sm">{analysisResult.overallAssessment}</p>
                </div>
                
                {analysisResult.issues.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Identified Issues</h3>
                    <Tabs defaultValue="list" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="list">List View</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="list" className="mt-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Issue</TableHead>
                              <TableHead>Severity</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analysisResult.issues.map((issue, index) => (
                              <TableRow key={index}>
                                <TableCell>{issue.name}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Progress value={issue.severity * 10} className="h-2 w-20" />
                                    <span className="text-xs">{issue.severity}/10</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TabsContent>
                      
                      <TabsContent value="details" className="mt-2 space-y-4">
                        {analysisResult.issues.map((issue, index) => (
                          <Card key={index} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">{issue.name}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Progress value={issue.severity * 10} className="h-2 flex-1" />
                                <span className="text-xs font-medium">Severity: {issue.severity}/10</span>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-2 pt-0">
                              <p className="text-sm mb-2">{issue.description}</p>
                              
                              {issue.recommendedActions.length > 0 && (
                                <div className="mt-2">
                                  <h4 className="text-xs font-semibold text-gray-500 mb-1">
                                    Recommended Actions:
                                  </h4>
                                  <ul className="text-sm space-y-1">
                                    {issue.recommendedActions.map((action, actionIndex) => (
                                      <li key={actionIndex} className="flex items-start gap-2">
                                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>{action}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setAnalysisResult(null);
                    setFile(null);
                    setPreviewUrl(null);
                    setNotes('');
                    setSaveToParcel(false);
                    setParcelId('');
                  }}
                >
                  Start New Analysis
                </Button>
                
                <Button 
                  variant="secondary"
                  onClick={() => {
                    // You can implement a print or export function here
                    window.print();
                  }}
                >
                  Export Results
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="h-full bg-gray-50 border-dashed border-2 flex flex-col justify-center items-center">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <ImagePlus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Analysis Yet</h3>
                <p className="text-gray-500 mb-6 max-w-xs">
                  Upload a crop image and analyze it to see the results here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropAnalysisPage;