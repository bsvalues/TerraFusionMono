import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import ParcelMap from '../../components/map/ParcelMap';
import { gisClient, Parcel as GISParcel, AreaUnit } from '../../lib/gis/gisClient';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import { toast } from "../../hooks/use-toast";
import L from 'leaflet';

// Interface for a parcel in the map component
interface Parcel {
  id: string;
  parcel_id: string;
  address?: string;
  owner_name?: string;
  geom: any; // GeoJSON
  centroid?: any; // GeoJSON
}

const GISExplorerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('view');
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(1000);
  const [searchLat, setSearchLat] = useState<number>(40.7128);
  const [searchLon, setSearchLon] = useState<number>(-74.0060);
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('ACRES');
  const [mapBounds, setMapBounds] = useState<[number, number, number, number]>(
    [-74.01, 40.70, -73.97, 40.75] // Default NYC area
  );
  const [parcels, setParcels] = useState<Parcel[]>([]);

  // Query to fetch parcels within the bounding box
  const parcelsQuery = useQuery({
    queryKey: ['parcelsInBBox', mapBounds],
    queryFn: async () => {
      return await gisClient.fetchParcelsInBBox(mapBounds);
    },
    enabled: mapBounds.every(coord => coord !== undefined),
  });

  // Query to fetch a single parcel by ID
  const parcelQuery = useQuery({
    queryKey: ['parcel', selectedParcelId],
    queryFn: async () => {
      if (!selectedParcelId) return null;
      return await gisClient.fetchParcel(selectedParcelId);
    },
    enabled: !!selectedParcelId,
  });

  // Query to fetch parcels near a point
  const nearPointQuery = useQuery({
    queryKey: ['parcelsNear', searchLat, searchLon, searchRadius],
    queryFn: async () => {
      return await gisClient.fetchParcelsNear(searchLat, searchLon, searchRadius);
    },
    enabled: false, // Only run when explicitly requested
  });

  // Query to calculate area of a parcel
  const areaQuery = useQuery({
    queryKey: ['parcelArea', selectedParcelId, areaUnit],
    queryFn: async () => {
      if (!selectedParcelId) return null;
      return await gisClient.calculateParcelArea(selectedParcelId, areaUnit);
    },
    enabled: !!selectedParcelId,
  });

  // Handle map bounds change
  const handleBoundsChanged = (bounds: L.LatLngBounds) => {
    const west = bounds.getWest();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const north = bounds.getNorth();
    
    setMapBounds([west, south, east, north]);
  };

  // Search for parcels near a point
  const handleSearchNearPoint = () => {
    nearPointQuery.refetch();
  };

  // Handle parcel selection
  const handleParcelSelect = (parcelId: string) => {
    setSelectedParcelId(parcelId);
  };

  // Convert GISParcel to Parcel for the map component
  const convertToMapParcel = (gisParcel: GISParcel): Parcel => {
    return {
      id: gisParcel.id,
      parcel_id: gisParcel.parcel_id,
      address: gisParcel.address,
      owner_name: gisParcel.owner_name,
      // Ensure geom is present, even if it's an empty GeoJSON
      geom: gisParcel.geom || { type: 'Feature', geometry: null, properties: {} },
      centroid: gisParcel.centroid
    };
  };

  // Update parcels when queries complete
  useEffect(() => {
    if (parcelsQuery.data) {
      const mappedParcels = parcelsQuery.data
        .filter(p => p.geom) // Only include parcels with geometry
        .map(convertToMapParcel);
      setParcels(mappedParcels);
    }
  }, [parcelsQuery.data]);

  useEffect(() => {
    if (nearPointQuery.data) {
      const mappedParcels = nearPointQuery.data
        .filter(p => p.geom) // Only include parcels with geometry
        .map(convertToMapParcel);
      setParcels(mappedParcels);
      
      toast({
        title: "Search Results",
        description: `Found ${nearPointQuery.data.length} parcels within ${searchRadius}m of the point.`,
      });
    }
  }, [nearPointQuery.data, searchRadius]);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">GIS Explorer</h1>
        <p className="text-gray-500">Explore and analyze property parcels using GIS tools</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar with tools */}
        <div className="md:col-span-1">
          <Tabs
            defaultValue="view"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="view">View</TabsTrigger>
              <TabsTrigger value="search">Search</TabsTrigger>
            </TabsList>

            <TabsContent value="view">
              <Card>
                <CardHeader>
                  <CardTitle>Map Navigation</CardTitle>
                  <CardDescription>
                    Pan and zoom the map to explore parcels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Current Bounds</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <Label className="text-xs">West</Label>
                          <Input value={mapBounds[0].toFixed(4)} readOnly />
                        </div>
                        <div>
                          <Label className="text-xs">East</Label>
                          <Input value={mapBounds[2].toFixed(4)} readOnly />
                        </div>
                        <div>
                          <Label className="text-xs">South</Label>
                          <Input value={mapBounds[1].toFixed(4)} readOnly />
                        </div>
                        <div>
                          <Label className="text-xs">North</Label>
                          <Input value={mapBounds[3].toFixed(4)} readOnly />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Parcels in View</Label>
                      <div className="mt-2 p-2 bg-gray-100 rounded h-20 overflow-y-auto">
                        {parcelsQuery.isLoading ? (
                          <p className="text-sm text-gray-500">Loading...</p>
                        ) : parcelsQuery.isError ? (
                          <p className="text-sm text-red-500">Error loading parcels</p>
                        ) : parcels.length === 0 ? (
                          <p className="text-sm text-gray-500">No parcels in view</p>
                        ) : (
                          <p className="text-sm">{parcels.length} parcels found</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search">
              <Card>
                <CardHeader>
                  <CardTitle>Search Parcels</CardTitle>
                  <CardDescription>
                    Find parcels by location
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Search Near Point</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <Label className="text-xs">Latitude</Label>
                          <Input 
                            type="number" 
                            value={searchLat} 
                            onChange={(e) => setSearchLat(parseFloat(e.target.value))}
                            step="0.0001"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Longitude</Label>
                          <Input 
                            type="number" 
                            value={searchLon} 
                            onChange={(e) => setSearchLon(parseFloat(e.target.value))}
                            step="0.0001"
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <Label className="text-xs">Radius (meters)</Label>
                        <Input 
                          type="number" 
                          value={searchRadius} 
                          onChange={(e) => setSearchRadius(parseFloat(e.target.value))}
                          min="100"
                          max="10000"
                        />
                      </div>
                      <Button 
                        className="w-full mt-2" 
                        onClick={handleSearchNearPoint}
                        disabled={nearPointQuery.isPending}
                      >
                        {nearPointQuery.isPending ? 'Searching...' : 'Search'}
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <Label>Search Results</Label>
                      <div className="mt-2 p-2 bg-gray-100 rounded h-20 overflow-y-auto">
                        {nearPointQuery.isPending ? (
                          <p className="text-sm text-gray-500">Searching...</p>
                        ) : nearPointQuery.isError ? (
                          <p className="text-sm text-red-500">Error performing search</p>
                        ) : !nearPointQuery.data ? (
                          <p className="text-sm text-gray-500">Use the form above to search</p>
                        ) : nearPointQuery.data.length === 0 ? (
                          <p className="text-sm text-gray-500">No parcels found</p>
                        ) : (
                          <p className="text-sm">{nearPointQuery.data.length} parcels found</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {selectedParcelId && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Parcel Details</CardTitle>
                <CardDescription>
                  {selectedParcelId}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {parcelQuery.isLoading ? (
                  <p className="text-sm text-gray-500">Loading parcel data...</p>
                ) : parcelQuery.isError ? (
                  <p className="text-sm text-red-500">Error loading parcel</p>
                ) : !parcelQuery.data ? (
                  <p className="text-sm text-gray-500">Parcel not found</p>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Address</Label>
                      <p className="text-sm">{parcelQuery.data.address || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Owner</Label>
                      <p className="text-sm">{parcelQuery.data.owner_name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Location</Label>
                      <p className="text-sm">{parcelQuery.data.county || 'N/A'}, {parcelQuery.data.state_code || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs d-flex align-items-center">
                        Area
                        <Select
                          value={areaUnit}
                          onValueChange={(value) => setAreaUnit(value as AreaUnit)}
                        >
                          <SelectTrigger className="ml-2 w-36 h-7">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SQUARE_METERS">Square Meters</SelectItem>
                            <SelectItem value="SQUARE_FEET">Square Feet</SelectItem>
                            <SelectItem value="ACRES">Acres</SelectItem>
                            <SelectItem value="HECTARES">Hectares</SelectItem>
                          </SelectContent>
                        </Select>
                      </Label>
                      {areaQuery.isLoading ? (
                        <p className="text-sm text-gray-500">Calculating...</p>
                      ) : areaQuery.isError ? (
                        <p className="text-sm text-red-500">Error calculating area</p>
                      ) : !areaQuery.data ? (
                        <p className="text-sm text-gray-500">N/A</p>
                      ) : (
                        <p className="text-sm font-semibold">{areaQuery.data.area.toFixed(2)} {areaQuery.data.unit.toLowerCase().replace('_', ' ')}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setSelectedParcelId(null)}
                >
                  Clear Selection
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Main map area */}
        <div className="md:col-span-2">
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              <ParcelMap
                parcels={parcels}
                height="100%"
                onBoundsChanged={handleBoundsChanged}
                onParcelClick={(parcel) => setSelectedParcelId(parcel.id)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GISExplorerPage;