import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SpatialAnalysisControlsProps {
  selectedParcelId: string | null;
  onHighlightGeometry: (geom: any) => void;
  onClearHighlight: () => void;
}

export default function SpatialAnalysisControls({
  selectedParcelId,
  onHighlightGeometry,
  onClearHighlight
}: SpatialAnalysisControlsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState('100');
  const [relationshipType, setRelationshipType] = useState('contains');
  const [neighbors, setNeighbors] = useState('5');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Function to call the various GIS endpoints
  const performAnalysis = async (operation: string) => {
    if (!selectedParcelId) {
      toast({
        title: "No parcel selected",
        description: "Please select a parcel on the map first.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    onClearHighlight();

    try {
      let url = '';
      let params = new URLSearchParams();
      params.append('parcelId', selectedParcelId);

      switch (operation) {
        case 'buffer':
          url = `/api/gis/buffer?${params.toString()}&distance=${distance}`;
          break;
        case 'convexHull':
          url = `/api/gis/convex-hull?${params.toString()}`;
          break;
        case 'validate':
          url = `/api/gis/validate-topology?${params.toString()}`;
          break;
        case 'relationship':
          url = `/api/gis/relationship?${params.toString()}&type=${relationshipType}`;
          break;
        case 'neighbors':
          url = `/api/gis/nearest-neighbors?${params.toString()}&count=${neighbors}`;
          break;
        case 'boundaries':
          url = `/api/gis/shared-boundaries?${params.toString()}`;
          break;
        case 'intersection':
          // This would require a second parcel ID, which we don't have in this UI yet
          url = `/api/gis/intersection?${params.toString()}`;
          break;
        case 'distance':
          // This would require a second parcel ID, which we don't have in this UI yet
          url = `/api/gis/distance?${params.toString()}`;
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred with the GIS analysis');
      }

      setAnalysisResult(data);

      // For operations that return geometries, highlight them on the map
      if (data.geometry || data.buffer || data.convexHull || data.validatedGeometry) {
        const geometry = data.geometry || data.buffer || data.convexHull || data.validatedGeometry;
        onHighlightGeometry(geometry);
      } else if (data.parcels && Array.isArray(data.parcels) && data.parcels.length > 0) {
        // If we have multiple parcels (like in nearest neighbors), highlight the first one
        // or create a feature collection of all parcels
        const geometry = {
          type: 'FeatureCollection',
          features: data.parcels.map((p: any) => ({
            type: 'Feature',
            properties: { id: p.id },
            geometry: p.geometry
          }))
        };
        onHighlightGeometry(geometry);
      }

      toast({
        title: "Analysis Complete",
        description: `${operation} analysis completed successfully.`,
      });
    } catch (error) {
      console.error("GIS Analysis error:", error);
      setAnalysisError(error instanceof Error ? error.message : 'An unknown error occurred');
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render analysis results
  const renderResults = () => {
    if (!analysisResult) return null;

    return (
      <div className="mt-4 p-3 bg-gray-50 rounded border">
        <h4 className="font-medium mb-2">Analysis Results:</h4>
        <div className="text-sm">
          {analysisResult.message && (
            <p className="mb-2">{analysisResult.message}</p>
          )}
          
          {analysisResult.isValid !== undefined && (
            <p className="mb-2">Topology Valid: {analysisResult.isValid ? 'Yes' : 'No'}</p>
          )}
          
          {analysisResult.distance !== undefined && (
            <p className="mb-2">Distance: {analysisResult.distance} meters</p>
          )}
          
          {analysisResult.area !== undefined && (
            <p className="mb-2">Area: {Math.round(analysisResult.area)} square meters</p>
          )}
          
          {analysisResult.length !== undefined && (
            <p className="mb-2">Length: {Math.round(analysisResult.length)} meters</p>
          )}
          
          {analysisResult.relationshipResult !== undefined && (
            <p className="mb-2">Relationship Result: {analysisResult.relationshipResult.toString()}</p>
          )}
          
          {analysisResult.parcels && Array.isArray(analysisResult.parcels) && (
            <div className="mb-2">
              <p className="font-medium">Matching Parcels:</p>
              <ul className="list-disc pl-5 mt-1">
                {analysisResult.parcels.map((parcel: any) => (
                  <li key={parcel.id || parcel.prop_id}>
                    {parcel.address || parcel.prop_id || parcel.id}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Spatial Analysis</CardTitle>
        <CardDescription>
          Select a parcel and perform GIS analysis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {selectedParcelId ? (
          <div className="mb-4">
            <p className="text-sm font-medium">Selected Parcel: {selectedParcelId}</p>
          </div>
        ) : (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No parcel selected. Click a parcel on the map to select it.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="buffer" className="mt-2">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="buffer">Buffer</TabsTrigger>
            <TabsTrigger value="topology">Topology</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
          </TabsList>
          
          <TabsContent value="buffer" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="distance">Buffer Distance (meters)</Label>
                <Input
                  id="distance"
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  min="1"
                  max="10000"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={() => performAnalysis('buffer')}
                disabled={loading || !selectedParcelId}
              >
                {loading ? 'Processing...' : 'Create Buffer'}
              </Button>
              
              <Button
                className="w-full"
                onClick={() => performAnalysis('convexHull')}
                variant="outline"
                disabled={loading || !selectedParcelId}
              >
                Create Convex Hull
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="topology" className="space-y-4">
            <Button
              className="w-full"
              onClick={() => performAnalysis('validate')}
              disabled={loading || !selectedParcelId}
            >
              Validate Topology
            </Button>
          </TabsContent>
          
          <TabsContent value="relationships" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="relationship-type">Relationship Type</Label>
                <Select
                  value={relationshipType}
                  onValueChange={setRelationshipType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="intersects">Intersects</SelectItem>
                    <SelectItem value="touches">Touches</SelectItem>
                    <SelectItem value="within">Within</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => performAnalysis('relationship')}
                disabled={loading || !selectedParcelId}
              >
                Check Relationship
              </Button>
              
              <div>
                <Label htmlFor="neighbors">Number of Neighbors</Label>
                <Input
                  id="neighbors"
                  type="number"
                  value={neighbors}
                  onChange={(e) => setNeighbors(e.target.value)}
                  min="1"
                  max="20"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => performAnalysis('neighbors')}
                disabled={loading || !selectedParcelId}
              >
                Find Nearest Neighbors
              </Button>
              
              <Button
                className="w-full"
                onClick={() => performAnalysis('boundaries')}
                variant="outline"
                disabled={loading || !selectedParcelId}
              >
                Find Shared Boundaries
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {analysisError && (
          <Alert className="mt-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{analysisError}</AlertDescription>
          </Alert>
        )}
        
        {renderResults()}
      </CardContent>
    </Card>
  );
}