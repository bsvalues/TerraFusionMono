import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderCircle, CheckCircle2, AlertCircle, GanttChart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type YieldPredictionResult = {
  prediction: string;
  confidenceLevel: number;
  factors: string[];
};

type ApiResponse = {
  success: boolean;
  prediction: YieldPredictionResult;
  usedFallback: boolean;
};

const healthStatusOptions = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'poor', label: 'Poor' },
  { value: 'critical', label: 'Critical' }
];

const cropTypeOptions = [
  { value: 'corn', label: 'Corn (Maize)' },
  { value: 'wheat', label: 'Wheat' },
  { value: 'soybean', label: 'Soybean' },
  { value: 'rice', label: 'Rice' },
  { value: 'cotton', label: 'Cotton' },
  { value: 'potato', label: 'Potato' },
  { value: 'tomato', label: 'Tomato' },
  { value: 'sugarcane', label: 'Sugarcane' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'barley', label: 'Barley' }
];

const YieldPredictionForm: React.FC = () => {
  const [cropType, setCropType] = useState('');
  const [healthStatus, setHealthStatus] = useState('');
  const [environmentalConditions, setEnvironmentalConditions] = useState('');
  const [historicalYields, setHistoricalYields] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cropType) {
      setError('Please select a crop type');
      return;
    }
    
    if (!healthStatus) {
      setError('Please select a health status');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await axios.post<ApiResponse>('/api/crop-analysis/predict-yield', {
        cropType,
        healthStatus,
        environmentalConditions: environmentalConditions || undefined,
        historicalYields: historicalYields || undefined
      });
      
      setResult(response.data);
    } catch (error: any) {
      console.error('Error predicting yield:', error);
      setError(error.response?.data?.error || 'An error occurred during yield prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GanttChart className="h-5 w-5" />
            Crop Yield Prediction
          </CardTitle>
          <CardDescription>
            Estimate potential crop yields based on current health status and environmental conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cropType">Crop Type</Label>
                <Select value={cropType} onValueChange={setCropType}>
                  <SelectTrigger id="cropType">
                    <SelectValue placeholder="Select crop type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cropTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="healthStatus">Current Health Status</Label>
                <Select value={healthStatus} onValueChange={setHealthStatus}>
                  <SelectTrigger id="healthStatus">
                    <SelectValue placeholder="Select health status" />
                  </SelectTrigger>
                  <SelectContent>
                    {healthStatusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="environmentalConditions">Environmental Conditions (Optional)</Label>
              <Textarea
                id="environmentalConditions"
                value={environmentalConditions}
                onChange={(e) => setEnvironmentalConditions(e.target.value)}
                placeholder="Describe current and expected weather conditions, irrigation status, etc."
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="historicalYields">Historical Yields (Optional)</Label>
              <Textarea
                id="historicalYields"
                value={historicalYields}
                onChange={(e) => setHistoricalYields(e.target.value)}
                placeholder="Previous yields for this crop and field, e.g. 'Last season: 180 bushels/acre, 5-year average: 175 bushels/acre'"
                className="min-h-[100px]"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full md:w-auto"
              disabled={loading || !cropType || !healthStatus}
            >
              {loading ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Predicting Yield...
                </>
              ) : 'Predict Yield'}
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
              Yield Prediction Results
              {result.usedFallback && (
                <span className="text-sm font-normal text-amber-500 bg-amber-50 px-2 py-1 rounded-md">
                  Using Fallback Data
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Based on {cropType} with {healthStatus} health status
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Prediction</h4>
              <p className="text-lg font-medium">{result.prediction.prediction}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Confidence Level</h4>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-200 text-blue-800">
                      {Math.round(result.prediction.confidenceLevel * 100)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                  <div style={{ width: `${Math.round(result.prediction.confidenceLevel * 100)}%` }} 
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500">
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Key Factors Considered</h4>
              <ul className="list-disc pl-5 space-y-1">
                {result.prediction.factors.map((factor, index) => (
                  <li key={index} className="text-gray-700">{factor}</li>
                ))}
              </ul>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-4">
            <p className="text-xs text-gray-500">
              Prediction Timestamp: {new Date().toLocaleString()}
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

export default YieldPredictionForm;