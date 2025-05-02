import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngBounds, LatLngTuple, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Fix for default marker icons in Leaflet with React
// This is needed because the default markers use relative paths that don't work in the build
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Define the Parcel type based on our schema
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

// Define props for our component
interface ParcelMapProps {
  parcels?: Parcel[];
  selectedParcelId?: number;
  onParcelSelect?: (parcelId: number) => void;
  height?: string;
  width?: string;
  initialZoom?: number;
  initialCenter?: [number, number]; // [lat, lng]
}

// Helper component to recenter the map when selectedParcelId changes
const MapController = ({ 
  selectedParcel, 
  fitBounds 
}: { 
  selectedParcel?: Parcel; 
  fitBounds?: boolean;
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectedParcel?.centerPoint && fitBounds) {
      map.setView(
        [selectedParcel.centerPoint.lat, selectedParcel.centerPoint.lng],
        14
      );
    }
  }, [selectedParcel, map, fitBounds]);
  
  return null;
};

// Set up default marker icons
const DefaultIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function ParcelMap({
  parcels = [],
  selectedParcelId,
  onParcelSelect,
  height = '600px',
  width = '100%',
  initialZoom = 10,
  initialCenter = [39.8283, -98.5795], // Center of USA
}: ParcelMapProps) {
  const [selectedParcel, setSelectedParcel] = useState<Parcel | undefined>();
  const { toast } = useToast();

  // Find selected parcel when selectedParcelId changes
  useEffect(() => {
    if (selectedParcelId) {
      const parcel = parcels.find(p => p.id === selectedParcelId);
      setSelectedParcel(parcel);
    } else {
      setSelectedParcel(undefined);
    }
  }, [selectedParcelId, parcels]);

  // Handle click on a parcel
  const handleParcelClick = (parcel: Parcel) => {
    if (onParcelSelect) {
      onParcelSelect(parcel.id);
    }
    setSelectedParcel(parcel);
    
    toast({
      title: "Parcel Selected",
      description: `Selected ${parcel.name} (ID: ${parcel.externalId})`,
    });
  };

  // Parse GeoJSON from parcel boundary
  const getGeoJSON = (parcel: Parcel) => {
    if (!parcel.boundary) return null;
    
    // If it's already a GeoJSON object, return it
    if (typeof parcel.boundary === 'object') {
      return parcel.boundary;
    }
    
    // If it's a string (e.g., from the API), parse it
    try {
      return JSON.parse(parcel.boundary);
    } catch (error) {
      console.error("Error parsing GeoJSON boundary:", error);
      return null;
    }
  };

  // Style for the GeoJSON polygons
  const getParcelStyle = (parcel: Parcel) => {
    const isSelected = parcel.id === selectedParcelId;
    
    return {
      color: isSelected ? '#ff4500' : '#3388ff',
      weight: isSelected ? 3 : 2,
      opacity: 1,
      fillColor: isSelected ? '#ff4500' : '#3388ff',
      fillOpacity: isSelected ? 0.3 : 0.2,
    };
  };

  return (
    <Card className="map-container w-full">
      <CardHeader className="py-3">
        <CardTitle>Property Map</CardTitle>
        <CardDescription>
          {selectedParcel 
            ? `Viewing: ${selectedParcel.name} (${selectedParcel.externalId})`
            : 'Click on a parcel to view details'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height, width, position: 'relative' }}>
          <MapContainer
            center={initialCenter}
            zoom={initialZoom}
            style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Center the map on the selected parcel */}
            <MapController selectedParcel={selectedParcel} fitBounds={!!selectedParcel} />
            
            {/* Render each parcel as a GeoJSON polygon */}
            {parcels.map(parcel => {
              const geojson = getGeoJSON(parcel);
              if (!geojson) return null;
              
              return (
                <GeoJSON
                  key={`parcel-${parcel.id}`}
                  data={geojson}
                  style={() => getParcelStyle(parcel)}
                  eventHandlers={{
                    click: () => handleParcelClick(parcel),
                  }}
                />
              );
            })}
            
            {/* Show markers for parcel center points */}
            {parcels.map(parcel => 
              parcel.centerPoint && (
                <Marker
                  key={`marker-${parcel.id}`}
                  position={[parcel.centerPoint.lat, parcel.centerPoint.lng]}
                  icon={DefaultIcon}
                  eventHandlers={{
                    click: () => handleParcelClick(parcel),
                  }}
                >
                  <Popup>
                    <div>
                      <h3 className="font-medium">{parcel.name}</h3>
                      <p className="text-sm text-gray-500">ID: {parcel.externalId}</p>
                      {parcel.description && (
                        <p className="text-sm mt-1">{parcel.description}</p>
                      )}
                      <Button 
                        size="sm" 
                        className="mt-2"
                        onClick={() => handleParcelClick(parcel)}
                      >
                        Select
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              )
            )}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}