import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Need to import the EditControl dynamically since it has type issues
let EditControl;
try {
  // This is a workaround to avoid TypeScript errors with the EditControl component
  // @ts-ignore
  EditControl = require('react-leaflet-draw').EditControl;
} catch (err) {
  console.error('Failed to load react-leaflet-draw:', err);
  // Provide a dummy component if the import fails
  EditControl = ({ children }) => <>{children}</>;
}

interface ParcelDrawingToolProps {
  initialGeometry?: any; // GeoJSON representation of existing parcel boundaries
  center?: [number, number]; // [latitude, longitude]
  zoom?: number;
  height?: string;
  readOnly?: boolean;
  onDrawComplete?: (geojson: any) => void;
  onGeometryChange?: (geojson: any) => void;
}

// The drawing tool component
const ParcelDrawingTool: React.FC<ParcelDrawingToolProps> = ({
  initialGeometry,
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 12,
  height = '500px',
  readOnly = false,
  onDrawComplete,
  onGeometryChange
}) => {
  const featureGroupRef = useRef<L.FeatureGroup>(null);
  const [drawnItems, setDrawnItems] = useState<any>(null);

  // Configuration for the draw controls
  const drawOptions = {
    position: 'topright',
    draw: {
      polyline: false,
      circle: false,
      circlemarker: false,
      marker: false,
      rectangle: {
        shapeOptions: {
          color: '#3388ff',
          weight: 3
        }
      },
      polygon: {
        allowIntersection: false,
        drawError: {
          color: '#e1e100',
          message: 'Self-intersecting polygons are not allowed'
        },
        shapeOptions: {
          color: '#3388ff',
          weight: 3
        }
      }
    },
    edit: {
      featureGroup: featureGroupRef.current,
      remove: !readOnly,
      edit: !readOnly
    }
  };

  // Child component to handle loading initial geometry
  const InitialGeometryLoader = ({ geometry }: { geometry: any }) => {
    const map = useMap();
    
    useEffect(() => {
      if (!geometry || !featureGroupRef.current) return;
      
      try {
        // Add the initial geometry to the feature group
        const geoJsonLayer = L.geoJSON(geometry);
        
        // Add the layer to the feature group
        geoJsonLayer.eachLayer(layer => {
          if (featureGroupRef.current) {
            featureGroupRef.current.addLayer(layer);
          }
        });
        
        // Fit the map to the bounds of the geometry
        if (geoJsonLayer.getBounds().isValid()) {
          map.fitBounds(geoJsonLayer.getBounds());
        }
      } catch (error) {
        console.error('Error loading initial geometry:', error);
      }
    }, [geometry, map]);
    
    return null;
  };

  // Event handlers for the EditControl
  const handleCreated = (e: any) => {
    const { layer } = e;
    
    if (featureGroupRef.current) {
      // Clear existing layers before adding the new one
      featureGroupRef.current.clearLayers();
      featureGroupRef.current.addLayer(layer);
      
      // Convert the layer to GeoJSON
      const geoJSON = layer.toGeoJSON();
      setDrawnItems(geoJSON);
      
      if (onDrawComplete) {
        onDrawComplete(geoJSON);
      }
      
      if (onGeometryChange) {
        onGeometryChange(geoJSON);
      }
    }
  };

  const handleEdited = (e: any) => {
    const { layers } = e;
    
    layers.eachLayer((layer: any) => {
      // Convert the layer to GeoJSON
      const geoJSON = layer.toGeoJSON();
      setDrawnItems(geoJSON);
      
      if (onDrawComplete) {
        onDrawComplete(geoJSON);
      }
      
      if (onGeometryChange) {
        onGeometryChange(geoJSON);
      }
    });
  };

  const handleDeleted = (e: any) => {
    setDrawnItems(null);
    
    if (onDrawComplete) {
      onDrawComplete(null);
    }
    
    if (onGeometryChange) {
      onGeometryChange(null);
    }
  };

  // Handle the case when editing is turned on/off
  useEffect(() => {
    // If the component becomes read-only, disable all editing controls
    if (readOnly && featureGroupRef.current) {
      // This would require accessing the edit controls directly, which isn't exposed in React-Leaflet
      // For a real implementation, we would need to reinitialize the EditControl with new options
    }
  }, [readOnly]);

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FeatureGroup ref={featureGroupRef}>
          {!readOnly && EditControl && (
            <EditControl
              position="topright"
              onCreated={handleCreated}
              onEdited={handleEdited}
              onDeleted={handleDeleted}
              draw={drawOptions.draw}
              edit={drawOptions.edit}
            />
          )}
        </FeatureGroup>
        
        {initialGeometry && (
          <InitialGeometryLoader geometry={initialGeometry} />
        )}
      </MapContainer>
    </div>
  );
};

export default ParcelDrawingTool;