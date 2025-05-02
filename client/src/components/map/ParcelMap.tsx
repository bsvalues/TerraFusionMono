import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMapEvents } from 'react-leaflet';
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

// Define the Parcel type
interface Parcel {
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
}

// MapEvents component to handle map interactions
const MapEvents = ({ onBoundsChanged }: { onBoundsChanged?: (bounds: L.LatLngBounds) => void }) => {
  const map = useMapEvents({
    moveend: () => {
      if (onBoundsChanged) {
        onBoundsChanged(map.getBounds());
      }
    },
    zoomend: () => {
      if (onBoundsChanged) {
        onBoundsChanged(map.getBounds());
      }
    }
  });
  return null;
};

// Main ParcelMap component
const ParcelMap: React.FC<ParcelMapProps> = ({
  parcels,
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 12,
  height = '500px',
  onBoundsChanged
}) => {
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  // Style for the GeoJSON parcels
  const parcelStyle = {
    color: '#3388ff',
    weight: 2,
    opacity: 0.7,
    fillColor: '#3388ff',
    fillOpacity: 0.2
  };

  // Style for the selected parcel
  const selectedParcelStyle = {
    color: '#ff4500',
    weight: 3,
    opacity: 1,
    fillColor: '#ff4500',
    fillOpacity: 0.3
  };

  // Zoom to a specific parcel when it's clicked
  const onEachFeature = (feature: any, layer: L.Layer) => {
    const parcelId = feature.properties.parcel_id;
    const address = feature.properties.address || 'No address';
    const owner = feature.properties.owner_name || 'Unknown owner';
    
    layer.bindPopup(`
      <div>
        <h3>Parcel: ${parcelId}</h3>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Owner:</strong> ${owner}</p>
      </div>
    `);
    
    layer.on({
      click: (e) => {
        // Reset styles for all layers
        if (geoJsonLayerRef.current) {
          geoJsonLayerRef.current.resetStyle();
        }
        
        // Set style for the clicked layer if it's a path (like polygon or polyline)
        if ('setStyle' in layer) {
          (layer as L.Path).setStyle(selectedParcelStyle);
        }
      }
    });
  };

  // Convert parcels to GeoJSON features
  const parcelFeatures = parcels.map(parcel => {
    // If the geom is a string, parse it; otherwise use it directly
    const geometry = typeof parcel.geom === 'string' 
      ? JSON.parse(parcel.geom) 
      : parcel.geom;
    
    return {
      type: 'Feature',
      geometry,
      properties: {
        id: parcel.id,
        parcel_id: parcel.parcel_id,
        address: parcel.address,
        owner_name: parcel.owner_name
      }
    };
  });

  const geoJsonData = {
    type: 'FeatureCollection',
    features: parcelFeatures
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
        
        <MapEvents onBoundsChanged={onBoundsChanged} />
        
        {parcels.length > 0 && (
          <GeoJSON
            data={geoJsonData as any}
            style={parcelStyle}
            onEachFeature={onEachFeature}
            ref={geoJsonLayerRef}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default ParcelMap;