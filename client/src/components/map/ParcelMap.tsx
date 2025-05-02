import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
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

// Interface for a parcel
export interface Parcel {
  id: string;
  parcel_id: string;
  address?: string;
  owner_name?: string;
  geom: any; // GeoJSON
  centroid?: any; // GeoJSON
}

// Props for the ParcelMap component
interface ParcelMapProps {
  parcels: Parcel[];
  center?: [number, number]; // [latitude, longitude]
  zoom?: number;
  height?: string;
  onBoundsChanged?: (bounds: L.LatLngBounds) => void;
  onParcelClick?: (parcel: Parcel) => void;
}

// Component to handle the map bounds changes
const MapBoundsHandler: React.FC<{ onBoundsChanged?: (bounds: L.LatLngBounds) => void }> = ({ 
  onBoundsChanged 
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (!onBoundsChanged) return;
    
    // Handler for bounds change
    const handleBoundsChange = () => {
      const bounds = map.getBounds();
      onBoundsChanged(bounds);
    };
    
    // Add event listeners
    map.on('moveend', handleBoundsChange);
    map.on('zoomend', handleBoundsChange);
    
    // Initial bounds
    handleBoundsChange();
    
    // Remove event listeners on cleanup
    return () => {
      map.off('moveend', handleBoundsChange);
      map.off('zoomend', handleBoundsChange);
    };
  }, [map, onBoundsChanged]);
  
  return null;
};

// The main component
const ParcelMap: React.FC<ParcelMapProps> = ({
  parcels,
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 12,
  height = '500px',
  onBoundsChanged,
  onParcelClick
}) => {
  // Style function for parcels
  const parcelStyle = (feature?: any) => {
    return {
      color: '#3388ff',
      weight: 2,
      opacity: 0.8,
      fillColor: '#3388ff',
      fillOpacity: 0.2
    };
  };
  
  // Click handler for parcels
  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (onParcelClick && feature.properties) {
      layer.on({
        click: () => {
          const parcel = parcels.find(p => p.id === feature.properties.id);
          if (parcel) {
            onParcelClick(parcel);
          }
        }
      });
    }
    
    // Add a popup with basic info
    if (feature.properties) {
      const { parcel_id, address, owner_name } = feature.properties;
      const popupContent = `
        <div>
          <strong>Parcel ID:</strong> ${parcel_id || 'N/A'}<br>
          ${address ? `<strong>Address:</strong> ${address}<br>` : ''}
          ${owner_name ? `<strong>Owner:</strong> ${owner_name}` : ''}
        </div>
      `;
      layer.bindPopup(popupContent);
    }
  };
  
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
        
        {parcels.map(parcel => {
          if (!parcel.geom) return null;
          
          // Ensure the GeoJSON has the properties needed for interaction
          const geoJSON = {
            ...parcel.geom,
            properties: {
              id: parcel.id,
              parcel_id: parcel.parcel_id,
              address: parcel.address,
              owner_name: parcel.owner_name
            }
          };
          
          return (
            <GeoJSON
              key={parcel.id}
              data={geoJSON}
              style={parcelStyle}
              onEachFeature={onEachFeature}
            />
          );
        })}
        
        {onBoundsChanged && (
          <MapBoundsHandler onBoundsChanged={onBoundsChanged} />
        )}
      </MapContainer>
    </div>
  );
};

export default ParcelMap;