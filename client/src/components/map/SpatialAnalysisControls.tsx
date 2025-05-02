import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

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
  const [analysisType, setAnalysisType] = useState<string>('buffer');
  const [bufferDistance, setBufferDistance] = useState<number>(100);
  const [bufferUnit, setBufferUnit] = useState<string>('METERS');
  const [targetParcelId, setTargetParcelId] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<string>('intersects');
  const [nearestLimit, setNearestLimit] = useState<number>(3);
  
  // Buffer Analysis
  const bufferQuery = useQuery({
    queryKey: ['gis', 'buffer', selectedParcelId, bufferDistance, bufferUnit],
    queryFn: async () => {
      if (!selectedParcelId) return null;
      const response = await fetch(`/api/gis/parcels/${selectedParcelId}/buffer?distance=${bufferDistance}&unit=${bufferUnit}`);
      if (!response.ok) throw new Error('Failed to fetch buffer data');
      return response.json();
    },
    enabled: false,
  });
  
  // Intersection Analysis
  const intersectionQuery = useQuery({
    queryKey: ['gis', 'intersects', selectedParcelId],
    queryFn: async () => {
      if (!selectedParcelId) return null;
      const response = await fetch(`/api/gis/parcels/${selectedParcelId}/intersects`);
      if (!response.ok) throw new Error('Failed to fetch intersection data');
      return response.json();
    },
    enabled: false,
  });
  
  // Convex Hull
  const convexHullQuery = useQuery({
    queryKey: ['gis', 'convexhull', selectedParcelId],
    queryFn: async () => {
      if (!selectedParcelId) return null;
      const response = await fetch(`/api/gis/parcels/${selectedParcelId}/convexhull`);
      if (!response.ok) throw new Error('Failed to fetch convex hull data');
      return response.json();
    },
    enabled: false,
  });
  
  // Spatial Relationship
  const relationshipQuery = useQuery({
    queryKey: ['gis', 'relation', selectedParcelId, targetParcelId, relationshipType],
    queryFn: async () => {
      if (!selectedParcelId || !targetParcelId) return null;
      const response = await fetch(`/api/gis/parcels/${selectedParcelId}/relation/${targetParcelId}?relation=${relationshipType}`);
      if (!response.ok) throw new Error('Failed to fetch spatial relationship data');
      return response.json();
    },
    enabled: false,
  });
  
  // Topology Validation
  const validationQuery = useQuery({
    queryKey: ['gis', 'validate', selectedParcelId],
    queryFn: async () => {
      if (!selectedParcelId) return null;
      const response = await fetch(`/api/gis/parcels/${selectedParcelId}/validate`);
      if (!response.ok) throw new Error('Failed to fetch validation data');
      return response.json();
    },
    enabled: false,
  });
  
  // Nearest Neighbors
  const nearestQuery = useQuery({
    queryKey: ['gis', 'nearest', selectedParcelId, nearestLimit],
    queryFn: async () => {
      if (!selectedParcelId) return null;
      const response = await fetch(`/api/gis/parcels/${selectedParcelId}/nearest?limit=${nearestLimit}&unit=METERS`);
      if (!response.ok) throw new Error('Failed to fetch nearest neighbors data');
      return response.json();
    },
    enabled: false,
  });
  
  // Function to run analysis based on selected type
  const runAnalysis = () => {
    // Clear previous highlights
    onClearHighlight();
    
    if (!selectedParcelId) {
      alert('Please select a parcel first');
      return;
    }
    
    switch (analysisType) {
      case 'buffer':
        bufferQuery.refetch().then(result => {
          if (result.data?.buffer_geom) {
            onHighlightGeometry(result.data.buffer_geom);
          }
        });
        break;
      case 'intersect':
        intersectionQuery.refetch();
        break;
      case 'convexhull':
        convexHullQuery.refetch().then(result => {
          if (result.data?.convex_hull) {
            onHighlightGeometry(result.data.convex_hull);
          }
        });
        break;
      case 'relation':
        if (!targetParcelId) {
          alert('Please enter a target parcel ID');
          return;
        }
        relationshipQuery.refetch();
        break;
      case 'validate':
        validationQuery.refetch();
        break;
      case 'nearest':
        nearestQuery.refetch().then(result => {
          if (result.data?.nearest_neighbors) {
            // Highlight all the nearest parcels
            const nearestGeoms = result.data.nearest_neighbors.map((n: any) => n.geom);
            onHighlightGeometry(nearestGeoms);
          }
        });
        break;
    }
  };
  
  const resetAnalysis = () => {
    onClearHighlight();
  };
  
  const isLoading = 
    bufferQuery.isFetching || 
    intersectionQuery.isFetching || 
    convexHullQuery.isFetching || 
    relationshipQuery.isFetching || 
    validationQuery.isFetching || 
    nearestQuery.isFetching;
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Spatial Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedParcelId ? (
          <div className="text-center p-4 text-sm text-gray-500">
            Select a parcel on the map to enable analysis tools
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Selected Parcel: {selectedParcelId}</p>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select analysis type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buffer">Buffer Analysis</SelectItem>
                  <SelectItem value="intersect">Intersection Analysis</SelectItem>
                  <SelectItem value="convexhull">Convex Hull</SelectItem>
                  <SelectItem value="relation">Spatial Relationship</SelectItem>
                  <SelectItem value="validate">Topology Validation</SelectItem>
                  <SelectItem value="nearest">Nearest Neighbors</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Tabs value={analysisType} className="w-full">
              <TabsContent value="buffer" className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium mb-1">Distance</p>
                    <Input 
                      type="number" 
                      value={bufferDistance} 
                      onChange={e => setBufferDistance(Number(e.target.value))} 
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Unit</p>
                    <Select value={bufferUnit} onValueChange={setBufferUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="METERS">Meters</SelectItem>
                        <SelectItem value="KILOMETERS">Kilometers</SelectItem>
                        <SelectItem value="FEET">Feet</SelectItem>
                        <SelectItem value="MILES">Miles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {bufferQuery.data && (
                  <div className="text-sm mt-4 p-2 bg-gray-50 rounded">
                    <p>Buffer created: {bufferDistance} {bufferUnit.toLowerCase()}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="intersect">
                {intersectionQuery.data && (
                  <div className="text-sm p-2 bg-gray-50 rounded">
                    <p>Intersecting parcels: {intersectionQuery.data.intersecting_count}</p>
                    {intersectionQuery.data.intersecting_parcels?.map((p: any) => (
                      <div key={p.parcel_id} className="text-xs mt-1">{p.parcel_id}</div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="convexhull">
                {convexHullQuery.data && (
                  <div className="text-sm p-2 bg-gray-50 rounded">
                    <p>Convexity ratio: {convexHullQuery.data.convexity_ratio.toFixed(2)}</p>
                    <p>Assessment: {convexHullQuery.data.complexity_assessment}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="relation" className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Target Parcel ID</p>
                  <Input 
                    value={targetParcelId} 
                    onChange={e => setTargetParcelId(e.target.value)} 
                    placeholder="Enter target parcel ID"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Relationship Type</p>
                  <Select value={relationshipType} onValueChange={setRelationshipType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intersects">Intersects</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="within">Within</SelectItem>
                      <SelectItem value="touches">Touches</SelectItem>
                      <SelectItem value="overlaps">Overlaps</SelectItem>
                      <SelectItem value="disjoint">Disjoint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {relationshipQuery.data && (
                  <div className="text-sm p-2 bg-gray-50 rounded">
                    <p>Result: {relationshipQuery.data.result ? 'True' : 'False'}</p>
                    {relationshipQuery.data.intersection_area_m2 && (
                      <p>Intersection area: {relationshipQuery.data.intersection_area_m2.toFixed(2)} m²</p>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="validate">
                {validationQuery.data && (
                  <div className="text-sm p-2 bg-gray-50 rounded">
                    <p>Valid: {validationQuery.data.validation.is_valid ? 'Yes' : 'No'}</p>
                    <p>Simple: {validationQuery.data.validation.is_simple ? 'Yes' : 'No'}</p>
                    <p>Vertices: {validationQuery.data.validation.num_vertices}</p>
                    <p>Message: {validationQuery.data.validation.validation_message}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="nearest" className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Number of neighbors</p>
                  <Input 
                    type="number" 
                    value={nearestLimit} 
                    onChange={e => setNearestLimit(Number(e.target.value))} 
                    min={1}
                    max={10}
                  />
                </div>
                {nearestQuery.data && (
                  <div className="text-sm p-2 bg-gray-50 rounded">
                    <p>Found {nearestQuery.data.count} nearest parcels:</p>
                    {nearestQuery.data.nearest_neighbors?.map((n: any) => (
                      <div key={n.parcel_id} className="text-xs mt-1">
                        {n.parcel_id} - {n.distance.toFixed(2)} meters
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={runAnalysis} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Run Analysis
              </Button>
              <Button 
                onClick={resetAnalysis} 
                variant="outline"
              >
                Reset
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}