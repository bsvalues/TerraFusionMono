import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface ParcelDrawingToolProps {
  onGeometryChange?: (geojson: any) => void; 
  initialGeometry?: any;
  height?: string;
  width?: string;
  center?: [number, number]; // [lat, lng]
  zoom?: number;
}

const MapInteractionController = ({ 
  featureGroupRef, 
  initialGeometry,
  onReady,
  onGeometryChange
}: { 
  featureGroupRef: React.RefObject<L.FeatureGroup>,
  initialGeometry?: any,
  onReady?: () => void,
  onGeometryChange?: (geojson: any) => void
}) => {
  const map = useMap();
  const { toast } = useToast();
  
  // Initialize the map with the initial geometry and set bounds
  useEffect(() => {
    if (!featureGroupRef.current) return;
    
    // Initialize with initial geometry if provided
    if (initialGeometry) {
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
    
    // Add a click handler to create polygon vertices
    const markers: L.Marker[] = [];
    let polyline: L.Polyline | null = null;
    let polygon: L.Polygon | null = null;
    
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const latlng = e.latlng;
      
      // Add a marker at the clicked location
      const marker = L.marker(latlng, {
        draggable: true,
      }).addTo(featureGroupRef.current!);
      
      marker.on('dragend', () => updatePolyline());
      markers.push(marker);
      
      // Update the polyline connecting the markers
      updatePolyline();
    };
    
    const updatePolyline = () => {
      // Remove existing polyline/polygon
      if (polyline) {
        featureGroupRef.current?.removeLayer(polyline);
      }
      if (polygon) {
        featureGroupRef.current?.removeLayer(polygon);
      }
      
      if (markers.length > 0) {
        const latlngs = markers.map(marker => marker.getLatLng());
        
        // If we have at least 3 points, create a polygon
        if (latlngs.length >= 3) {
          polygon = L.polygon(latlngs, { color: '#ff4500' })
            .addTo(featureGroupRef.current!);
          
          // Store the GeoJSON for the polygon
          if (onGeometryChange) {
            const geojson = polygon.toGeoJSON();
            onGeometryChange(geojson);
          }
        } else {
          // Otherwise, just create a line
          polyline = L.polyline(latlngs, { color: '#3388ff' })
            .addTo(featureGroupRef.current!);
        }
      }
    };
    
    map.on('click', handleMapClick);
    
    // Add custom UI elements using DOM instead of Leaflet Controls
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'leaflet-top leaflet-right';
    controlsDiv.style.zIndex = '1000';
    controlsDiv.innerHTML = `
      <div class="leaflet-control leaflet-bar" style="margin-top: 10px; margin-right: 10px;">
        <a 
          href="#" 
          id="complete-polygon-btn"
          title="Complete Polygon" 
          style="display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; background: white; width: 30px; height: 30px; text-decoration: none;"
        >
          ✓
        </a>
        <a 
          href="#" 
          id="clear-polygon-btn"
          title="Clear All" 
          style="display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; background: white; width: 30px; height: 30px; text-decoration: none; border-top: 1px solid #ccc;"
        >
          ×
        </a>
      </div>
    `;
    
    map.getContainer().appendChild(controlsDiv);
    
    // Add event listeners to the buttons
    const completeBtn = document.getElementById('complete-polygon-btn');
    const clearBtn = document.getElementById('clear-polygon-btn');
    
    if (completeBtn) {
      completeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (markers.length >= 3) {
          // Finalize the polygon
          if (polygon) {
            const geojson = polygon.toGeoJSON();
            if (onGeometryChange) {
              onGeometryChange(geojson);
            }
            
            toast({
              title: "Polygon completed",
              description: "Your polygon has been created. You can edit it by dragging the points.",
            });
          }
        } else {
          toast({
            title: "Not enough points",
            description: "You need at least 3 points to create a polygon. Click on the map to add more points.",
            variant: "destructive",
          });
        }
      });
    }
    
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove all markers, polylines, and polygons
        markers.forEach(marker => {
          featureGroupRef.current?.removeLayer(marker);
        });
        
        if (polyline) {
          featureGroupRef.current?.removeLayer(polyline);
          polyline = null;
        }
        
        if (polygon) {
          featureGroupRef.current?.removeLayer(polygon);
          polygon = null;
        }
        
        // Clear the markers array
        markers.length = 0;
        
        // Notify that no geometry exists
        if (onGeometryChange) {
          onGeometryChange(null);
        }
        
        toast({
          title: "Cleared",
          description: "All points have been cleared from the map.",
        });
      });
    }
    
    if (onReady) {
      onReady();
    }
    
    // Cleanup function
    return () => {
      map.off('click', handleMapClick);
      map.getContainer().removeChild(controlsDiv);
    };
  }, [featureGroupRef, initialGeometry, map, onReady, onGeometryChange, toast]);
  
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
  const [currentGeometry, setCurrentGeometry] = useState<any>(initialGeometry);
  
  // Handle changes from the map controller
  const handleInternalGeometryChange = (geojson: any) => {
    setCurrentGeometry(geojson);
    
    // Only call the external handler when the save button is clicked
  };
  
  // Handle the save button click
  const handleSaveGeometry = () => {
    if (!currentGeometry) {
      toast({
        title: "No geometry drawn",
        description: "Please draw a shape on the map first.",
        variant: "destructive",
      });
      return;
    }
    
    // Call the external handler with the current geometry
    if (onGeometryChange) {
      onGeometryChange(currentGeometry);
    }
    
    toast({
      title: "Geometry saved",
      description: "The drawn geometry has been successfully saved.",
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Parcel Geometry Editor</CardTitle>
        <CardDescription>
          Click on the map to add points. Drag points to adjust the shape.
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
              {/* The layers will be added programmatically */}
            </FeatureGroup>
            
            <MapInteractionController 
              featureGroupRef={featureGroupRef} 
              initialGeometry={initialGeometry}
              onGeometryChange={handleInternalGeometryChange}
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
              setCurrentGeometry(null);
              toast({
                title: "Cleared",
                description: "All shapes have been cleared from the map.",
              });
            }
          }}
        >
          Clear Map
        </Button>
        <Button
          onClick={handleSaveGeometry}
          disabled={!currentGeometry}
        >
          Save Geometry
        </Button>
      </CardFooter>
    </Card>
  );
}