import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, GeoJSON, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import SpatialAnalysisControls from './SpatialAnalysisControls';

// Fix for Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Function to ensure we don't load until leaflet is available in window
function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

// Component to highlight a GeoJSON on the map
function HighlightLayer({ geometry, mapInstance }: { geometry: any; mapInstance: L.Map }) {
  const [geoJsonLayer, setGeoJsonLayer] = useState<L.GeoJSON | null>(null);

  useEffect(() => {
    if (!geometry || !mapInstance) return;

    // Remove previous layer if exists
    if (geoJsonLayer) {
      mapInstance.removeLayer(geoJsonLayer);
    }

    // Create new layer with the geometry
    const layer = L.geoJSON(geometry, {
      style: {
        color: '#FF4500',
        weight: 3,
        opacity: 0.7,
        fillColor: '#FF8C00',
        fillOpacity: 0.3
      }
    });

    // Add the layer to the map
    layer.addTo(mapInstance);

    // Store the layer reference
    setGeoJsonLayer(layer);

    // Zoom to fit the layer bounds
    mapInstance.fitBounds(layer.getBounds());

    // Cleanup function
    return () => {
      if (layer) {
        mapInstance.removeLayer(layer);
      }
    };
  }, [geometry, mapInstance]);

  return null;
}

interface ParcelMapProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export default function ParcelMap({
  center = [34.05, -118.25], // Default center (Los Angeles)
  zoom = 13,
  height = '600px'
}: ParcelMapProps) {
  // Need to use state to store the map instance, not ref
  const [map, setMap] = useState<L.Map | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [highlightGeometry, setHighlightGeometry] = useState<any>(null);

  // Query to fetch all parcels
  const parcelsQuery = useQuery({
    queryKey: ['/api/gis/parcels'],
    queryFn: async () => {
      const response = await fetch('/api/gis/parcels');
      if (!response.ok) throw new Error('Failed to fetch parcels');
      return response.json();
    }
  });

  // Function to handle parcel click
  const handleParcelClick = (parcel: any) => {
    setSelectedParcel(parcel);
  };

  // Function to handle highlight geometry
  const handleHighlightGeometry = (geometry: any) => {
    setHighlightGeometry(geometry);
  };

  // Function to clear highlight
  const handleClearHighlight = () => {
    setHighlightGeometry(null);
  };
  
  // Function to get reference to the map
  const SetMapRef = () => {
    const map = useMap();
    
    // Effect runs once when component mounts
    useEffect(() => {
      setMap(map);
    }, [map]);
    
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Property Map</CardTitle>
          </CardHeader>
          <CardContent>
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
                <ChangeMapView center={center} zoom={zoom} />
                <SetMapRef />

                {parcelsQuery.data?.parcels && (
                  <GeoJSON
                    data={parcelsQuery.data.parcels}
                    style={{
                      color: '#3388ff',
                      weight: 2,
                      opacity: 0.65,
                      fillOpacity: 0.1
                    }}
                    onEachFeature={(feature, layer) => {
                      const parcelId = feature.properties?.prop_id || 'Unknown';
                      const address = feature.properties?.address || 'No address';
                      const owner = feature.properties?.owner_name || 'Unknown owner';

                      layer.bindPopup(
                        `<div class="parcel-popup">
                          <h3>${parcelId}</h3>
                          <p>${address}</p>
                          <p>Owner: ${owner}</p>
                        </div>`
                      );

                      layer.on('click', () => {
                        handleParcelClick({
                          id: feature.properties?.id,
                          prop_id: parcelId,
                          address,
                          owner_name: owner,
                          geometry: feature.geometry
                        });
                      });
                    }}
                  />
                )}

                {map && highlightGeometry && (
                  <HighlightLayer geometry={highlightGeometry} mapInstance={map} />
                )}
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <SpatialAnalysisControls 
          selectedParcelId={selectedParcel?.prop_id || null}
          onHighlightGeometry={handleHighlightGeometry}
          onClearHighlight={handleClearHighlight}
        />
      </div>
    </div>
  );
}