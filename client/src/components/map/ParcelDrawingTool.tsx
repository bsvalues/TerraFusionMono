import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// This makes TypeScript aware of the Leaflet Draw module
import L from 'leaflet';
import 'leaflet-draw';

interface ParcelDrawingToolProps {
  onGeometryChange?: (geojson: any) => void; 
  initialGeometry?: any;
  height?: string;
  width?: string;
  center?: [number, number]; // [lat, lng]
  zoom?: number;
}

const LeafletDrawController = ({ 
  featureGroupRef, 
  initialGeometry,
  onReady
}: { 
  featureGroupRef: React.RefObject<L.FeatureGroup>,
  initialGeometry?: any,
  onReady?: () => void
}) => {
  const map = useMap();
  
  // Initialize the map with the initial geometry and set bounds
  useEffect(() => {
    if (initialGeometry && featureGroupRef.current) {
      try {
        // Clear existing layers
        featureGroupRef.current.clearLayers();
        
        // Add the GeoJSON to the feature group
        const layer = L.geoJSON(initialGeometry);
        layer.eachLayer(l => {
          featureGroupRef.current?.addLayer(l);
        });
        
        // Set map bounds to the geometry
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds);
        }
      } catch (error) {
        console.error('Error loading initial geometry:', error);
      }
    }
    
    if (onReady) {
      onReady();
    }
  }, [featureGroupRef, initialGeometry, map, onReady]);
  
  return null;
};

export default function ParcelDrawingTool({
  onGeometryChange,
  initialGeometry,
  height = '500px',
  width = '100%',
  center = [39.8283, -98.5795], // Center of USA
  zoom = 5
}: ParcelDrawingToolProps) {
  const { toast } = useToast();
  const featureGroupRef = useRef<L.FeatureGroup>(null);
  const [mapReady, setMapReady] = useState(false);
  const [geometryExists, setGeometryExists] = useState(!!initialGeometry);
  const [currentGeometry, setCurrentGeometry] = useState<any>(initialGeometry);
  
  // Extract and convert the geometry to GeoJSON 
  const extractGeoJSON = () => {
    if (!featureGroupRef.current) return null;
    
    const layers = featureGroupRef.current.getLayers();
    if (layers.length === 0) return null;
    
    // Create GeoJSON representation of the drawn shapes
    const geojson = featureGroupRef.current.toGeoJSON();
    return geojson;
  };
  
  // Handle exporting the geometry
  const handleExportGeometry = () => {
    const geojson = extractGeoJSON();
    if (!geojson) {
      toast({
        title: "No geometry drawn",
        description: "Please draw a shape on the map first.",
        variant: "destructive",
      });
      return;
    }
    
    // Emit the geometry via the callback
    if (onGeometryChange) {
      onGeometryChange(geojson);
    }
    
    // Save a copy in the current state
    setCurrentGeometry(geojson);
    
    toast({
      title: "Geometry captured",
      description: "The drawn geometry has been successfully captured.",
    });
  };
  
  // Handle created event from the draw control
  const handleCreated = (e: any) => {
    setGeometryExists(true);
    
    toast({
      title: "Shape created",
      description: `${e.layerType} has been drawn. Click save to use this geometry.`,
    });
  };
  
  // Handle edited event from the draw control
  const handleEdited = (e: any) => {
    toast({
      title: "Shape edited",
      description: `${e.layers.getLayers().length} layers edited. Click save to update.`,
    });
  };
  
  // Handle deleted event from the draw control
  const handleDeleted = (e: any) => {
    // Check if any layers remain after deletion
    if (featureGroupRef.current) {
      const layersCount = featureGroupRef.current.getLayers().length;
      setGeometryExists(layersCount > 0);
      
      toast({
        title: "Shape deleted",
        description: `${e.layers.getLayers().length} layers removed.`,
      });
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Parcel Geometry Editor</CardTitle>
        <CardDescription>
          Use the drawing tools to create or edit parcel boundaries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height, width, position: 'relative' }}>
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <FeatureGroup ref={featureGroupRef}>
              {mapReady && (
                <EditControl
                  position="topright"
                  draw={{
                    rectangle: true,
                    polygon: true,
                    circle: false, // Circle isn't supported by many GIS systems
                    circlemarker: false,
                    marker: false,
                    polyline: false,
                  }}
                  onCreated={handleCreated}
                  onEdited={handleEdited}
                  onDeleted={handleDeleted}
                />
              )}
            </FeatureGroup>
            
            <LeafletDrawController 
              featureGroupRef={featureGroupRef} 
              initialGeometry={initialGeometry}
              onReady={() => setMapReady(true)}
            />
          </MapContainer>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (featureGroupRef.current) {
              featureGroupRef.current.clearLayers();
              setGeometryExists(false);
              toast({
                title: "Cleared",
                description: "All shapes have been cleared from the map.",
              });
            }
          }}
        >
          Clear
        </Button>
        <Button
          onClick={handleExportGeometry}
          disabled={!geometryExists}
        >
          Save Geometry
        </Button>
      </CardFooter>
    </Card>
  );
}