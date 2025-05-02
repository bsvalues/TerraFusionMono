import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import ParcelMap from '@/components/map/ParcelMap';
import ParcelDrawingTool from '@/components/map/ParcelDrawingTool';
import { gisClient } from '@/lib/gis/gisClient';

// Interface for Parcel with GIS data
interface Parcel {
  id: number;
  externalId: string;
  name: string;
  description?: string;
  boundary?: any; // GeoJSON
  centerPoint?: {
    lat: number;
    lng: number;
  };
  geom?: string; // WKT
}

/**
 * GIS Explorer Page Component
 * 
 * This page provides a comprehensive interface for exploring and testing
 * the GIS capabilities of TerraFusion, including:
 * - Viewing parcels on a map
 * - Drawing and editing geometries
 * - Performing spatial queries (nearby, bbox, intersect)
 * - Converting between geometry formats (WKT, GeoJSON)
 */
export default function GISExplorerPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State for the selected parcel
  const [selectedParcelId, setSelectedParcelId] = useState<number | undefined>();
  const [searchRadius, setSearchRadius] = useState<number>(1000); // meters
  const [searchPoint, setSearchPoint] = useState({ lat: 0, lng: 0 });
  const [boundingBox, setBoundingBox] = useState({
    minLat: 0, minLng: 0, maxLat: 0, maxLng: 0
  });
  const [drawnGeometry, setDrawnGeometry] = useState<any>(null);
  
  // Query to fetch all parcels
  const { data: parcels = [], isLoading: isLoadingParcels } = useQuery({
    queryKey: ['/gis/parcels'],
    queryFn: () => gisClient.getParcels(),
  });
  
  // Query to fetch a specific parcel details
  const { data: selectedParcel, isLoading: isLoadingSelectedParcel } = useQuery({
    queryKey: ['/gis/parcels', selectedParcelId],
    queryFn: () => selectedParcelId ? gisClient.getParcel(selectedParcelId) : null,
    enabled: !!selectedParcelId
  });
  
  // Handle parcel selection
  const handleParcelSelect = (parcelId: number) => {
    setSelectedParcelId(parcelId);
  };
  
  // Handle searching for parcels near a point
  const handleSearchNearby = async () => {
    try {
      const nearbyParcels = await gisClient.findParcelsNearPoint(
        searchPoint.lat, 
        searchPoint.lng, 
        searchRadius
      );
      
      if (nearbyParcels.length === 0) {
        toast({
          title: "No parcels found",
          description: `No parcels found within ${searchRadius}m of the specified point.`,
        });
      } else {
        toast({
          title: "Parcels found",
          description: `Found ${nearbyParcels.length} parcels within ${searchRadius}m of the specified point.`,
        });
        
        // Update the parcels in the cache
        queryClient.setQueryData(['/gis/parcels'], nearbyParcels);
      }
    } catch (error) {
      console.error("Error searching for nearby parcels:", error);
      toast({
        title: "Error",
        description: "Failed to search for nearby parcels.",
        variant: "destructive",
      });
    }
  };
  
  // Handle searching for parcels in a bounding box
  const handleSearchBbox = async () => {
    try {
      const bboxParcels = await gisClient.findParcelsInBbox(
        boundingBox.minLat,
        boundingBox.minLng,
        boundingBox.maxLat,
        boundingBox.maxLng
      );
      
      if (bboxParcels.length === 0) {
        toast({
          title: "No parcels found",
          description: "No parcels found within the specified bounding box.",
        });
      } else {
        toast({
          title: "Parcels found",
          description: `Found ${bboxParcels.length} parcels within the bounding box.`,
        });
        
        // Update the parcels in the cache
        queryClient.setQueryData(['/gis/parcels'], bboxParcels);
      }
    } catch (error) {
      console.error("Error searching for parcels in bbox:", error);
      toast({
        title: "Error",
        description: "Failed to search for parcels in the bounding box.",
        variant: "destructive",
      });
    }
  };
  
  // Handle converting the drawn geometry to WKT and searching
  const handleSearchIntersect = async () => {
    if (!drawnGeometry) {
      toast({
        title: "No geometry drawn",
        description: "Please draw a shape on the map first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Convert GeoJSON to WKT
      const wkt = await gisClient.geoJSONToWkt(drawnGeometry);
      
      if (!wkt) {
        toast({
          title: "Conversion failed",
          description: "Failed to convert the drawn geometry to WKT.",
          variant: "destructive",
        });
        return;
      }
      
      // Search for intersecting parcels
      const intersectingParcels = await gisClient.findParcelsIntersecting(wkt);
      
      if (intersectingParcels.length === 0) {
        toast({
          title: "No parcels found",
          description: "No parcels found intersecting with the drawn geometry.",
        });
      } else {
        toast({
          title: "Parcels found",
          description: `Found ${intersectingParcels.length} parcels intersecting with the drawn geometry.`,
        });
        
        // Update the parcels in the cache
        queryClient.setQueryData(['/gis/parcels'], intersectingParcels);
      }
    } catch (error) {
      console.error("Error searching for intersecting parcels:", error);
      toast({
        title: "Error",
        description: "Failed to search for intersecting parcels.",
        variant: "destructive",
      });
    }
  };
  
  // Handle resetting to fetch all parcels
  const handleResetParcels = async () => {
    try {
      // Invalidate the parcels query to refetch all parcels
      await queryClient.invalidateQueries({ queryKey: ['/gis/parcels'] });
      toast({
        title: "Reset successful",
        description: "Displaying all parcels again.",
      });
    } catch (error) {
      console.error("Error resetting parcels:", error);
      toast({
        title: "Error",
        description: "Failed to reset parcels.",
        variant: "destructive",
      });
    }
  };
  
  // Handle changes to the drawn geometry
  const handleGeometryChange = (geojson: any) => {
    setDrawnGeometry(geojson);
  };
  
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">TerraFusion GIS Explorer</h1>
        <p className="text-gray-500">
          Explore, analyze, and visualize geospatial data with the TerraFusion GIS capabilities
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel: Controls and tools */}
        <div className="lg:col-span-1">
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="draw">Draw</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            
            {/* Search tab */}
            <TabsContent value="search">
              <Card>
                <CardHeader>
                  <CardTitle>Spatial Search</CardTitle>
                  <CardDescription>
                    Find parcels using spatial queries
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Nearby search */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium mb-2">Search Near Point</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="search-lat">Latitude</Label>
                        <Input
                          id="search-lat"
                          type="number"
                          step="0.000001"
                          value={searchPoint.lat}
                          onChange={(e) => setSearchPoint(prev => ({
                            ...prev,
                            lat: parseFloat(e.target.value) || 0
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="search-lng">Longitude</Label>
                        <Input
                          id="search-lng"
                          type="number"
                          step="0.000001"
                          value={searchPoint.lng}
                          onChange={(e) => setSearchPoint(prev => ({
                            ...prev,
                            lng: parseFloat(e.target.value) || 0
                          }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="search-radius">
                        Radius: {searchRadius}m
                      </Label>
                      <Slider
                        id="search-radius"
                        min={100}
                        max={10000}
                        step={100}
                        value={[searchRadius]}
                        onValueChange={(value) => setSearchRadius(value[0])}
                        className="mt-2"
                      />
                    </div>
                    <Button onClick={handleSearchNearby} className="w-full">
                      Search Nearby
                    </Button>
                  </div>
                  
                  <div className="border-t pt-4">
                    {/* Bounding box search */}
                    <h3 className="text-sm font-medium mb-2">Bounding Box Search</h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label htmlFor="min-lat">Min Latitude</Label>
                        <Input
                          id="min-lat"
                          type="number"
                          step="0.000001"
                          value={boundingBox.minLat}
                          onChange={(e) => setBoundingBox(prev => ({
                            ...prev,
                            minLat: parseFloat(e.target.value) || 0
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="min-lng">Min Longitude</Label>
                        <Input
                          id="min-lng"
                          type="number"
                          step="0.000001"
                          value={boundingBox.minLng}
                          onChange={(e) => setBoundingBox(prev => ({
                            ...prev,
                            minLng: parseFloat(e.target.value) || 0
                          }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label htmlFor="max-lat">Max Latitude</Label>
                        <Input
                          id="max-lat"
                          type="number"
                          step="0.000001"
                          value={boundingBox.maxLat}
                          onChange={(e) => setBoundingBox(prev => ({
                            ...prev,
                            maxLat: parseFloat(e.target.value) || 0
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-lng">Max Longitude</Label>
                        <Input
                          id="max-lng"
                          type="number"
                          step="0.000001"
                          value={boundingBox.maxLng}
                          onChange={(e) => setBoundingBox(prev => ({
                            ...prev,
                            maxLng: parseFloat(e.target.value) || 0
                          }))}
                        />
                      </div>
                    </div>
                    <Button onClick={handleSearchBbox} className="w-full">
                      Search in Bbox
                    </Button>
                  </div>
                  
                  <div className="border-t pt-4">
                    {/* Intersection search */}
                    <h3 className="text-sm font-medium mb-2">Intersection Search</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      Search for parcels that intersect with the drawn geometry
                    </p>
                    <Button 
                      onClick={handleSearchIntersect} 
                      className="w-full"
                      disabled={!drawnGeometry}
                    >
                      Find Intersecting Parcels
                    </Button>
                  </div>
                  
                  <div className="border-t pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleResetParcels} 
                      className="w-full"
                    >
                      Reset All Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Draw tab */}
            <TabsContent value="draw">
              <ParcelDrawingTool 
                onGeometryChange={handleGeometryChange}
                initialGeometry={drawnGeometry}
                height="500px"
              />
            </TabsContent>
            
            {/* Details tab */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Parcel Details</CardTitle>
                  <CardDescription>
                    {selectedParcel 
                      ? `Viewing details for ${selectedParcel.name}`
                      : 'Select a parcel on the map to view details'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedParcel ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium">ID</h3>
                        <p className="text-sm">{selectedParcel.externalId}</p>
                      </div>
                      <div>
                        <h3 className="font-medium">Name</h3>
                        <p className="text-sm">{selectedParcel.name}</p>
                      </div>
                      {selectedParcel.description && (
                        <div>
                          <h3 className="font-medium">Description</h3>
                          <p className="text-sm">{selectedParcel.description}</p>
                        </div>
                      )}
                      {selectedParcel.centerPoint && (
                        <div>
                          <h3 className="font-medium">Center Point</h3>
                          <p className="text-sm">
                            Lat: {selectedParcel.centerPoint.lat.toFixed(6)}, 
                            Lng: {selectedParcel.centerPoint.lng.toFixed(6)}
                          </p>
                        </div>
                      )}
                      {selectedParcel.perimeter && (
                        <div>
                          <h3 className="font-medium">Perimeter</h3>
                          <p className="text-sm">{selectedParcel.perimeter.toFixed(2)} meters</p>
                        </div>
                      )}
                      {selectedParcel.geom && (
                        <div>
                          <h3 className="font-medium">WKT Geometry</h3>
                          <p className="text-xs truncate">{selectedParcel.geom}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No parcel selected. Click on a parcel in the map to view its details.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right panel: Map */}
        <div className="lg:col-span-2">
          <ParcelMap 
            parcels={parcels}
            selectedParcelId={selectedParcelId}
            onParcelSelect={handleParcelSelect}
            height="700px"
          />
        </div>
      </div>
    </div>
  );
}