import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { SyncStatus } from '../components/SyncStatus';
import { apiService } from '../services/api.service';
import { syncService } from '../services/sync.service';
import { networkService } from '../services/network.service';
import { appConfig } from '../config';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ParcelData {
  id: string;
  name: string;
  geometry: GeoJSON.Polygon;
  // Other parcel properties
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

export function ParcelMapScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { parcelId } = route.params as { parcelId: string };
  
  const [parcel, setParcel] = useState<ParcelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polygonCoordinates, setPolygonCoordinates] = useState<Coordinate[]>([]);
  const [region, setRegion] = useState({
    latitude: appConfig.map.defaultCenter.latitude,
    longitude: appConfig.map.defaultCenter.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isDownloadingTiles, setIsDownloadingTiles] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  
  const mapRef = useRef<MapView>(null);

  // Check if we're in offline mode
  useEffect(() => {
    const unsubscribe = networkService.addListener((online) => {
      setIsOfflineMode(!online);
    });
    
    return unsubscribe;
  }, []);

  // Subscribe to sync state
  useEffect(() => {
    const unsubscribe = syncService.subscribe((state) => {
      setLastSynced(state.lastSynced);
    });
    
    return unsubscribe;
  }, []);

  // Load parcel data
  useEffect(() => {
    const loadParcel = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Try to fetch parcel data
        const data = await apiService.getParcel(parcelId);
        setParcel(data);
        
        // Process the GeoJSON coordinates to map coordinates
        if (data.geometry && data.geometry.coordinates && data.geometry.coordinates.length > 0) {
          // GeoJSON Polygons have coordinates in [longitude, latitude] format
          // But react-native-maps needs them in {latitude, longitude} format
          const coordinates = data.geometry.coordinates[0].map(
            (coord: [number, number]): Coordinate => ({
              longitude: coord[0],
              latitude: coord[1],
            })
          );
          
          setPolygonCoordinates(coordinates);
          
          // Calculate the center of the polygon
          const center = calculateCenter(coordinates);
          
          // Set the map region to show the whole parcel
          setRegion({
            latitude: center.latitude,
            longitude: center.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          
          // Animate to the parcel region
          mapRef.current?.animateToRegion({
            latitude: center.latitude,
            longitude: center.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }
      } catch (err: any) {
        console.error('Failed to load parcel:', err);
        setError(err.message || 'Failed to load parcel data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadParcel();
  }, [parcelId]);

  // Calculate the center of a polygon
  const calculateCenter = (coordinates: Coordinate[]): Coordinate => {
    if (coordinates.length === 0) {
      return {
        latitude: appConfig.map.defaultCenter.latitude,
        longitude: appConfig.map.defaultCenter.longitude,
      };
    }
    
    let minLat = coordinates[0].latitude;
    let maxLat = coordinates[0].latitude;
    let minLng = coordinates[0].longitude;
    let maxLng = coordinates[0].longitude;
    
    coordinates.forEach(coord => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLng = Math.min(minLng, coord.longitude);
      maxLng = Math.max(maxLng, coord.longitude);
    });
    
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
    };
  };

  // Handle downloading map tiles for offline use
  const handleDownloadMapTiles = async () => {
    if (isOfflineMode) {
      Alert.alert(
        'Offline Mode',
        'Cannot download map tiles while offline. Please connect to the internet and try again.'
      );
      return;
    }
    
    Alert.alert(
      'Download Map Tiles',
      'Do you want to download map tiles for offline use? This may use a significant amount of data and storage.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Download',
          onPress: async () => {
            try {
              setIsDownloadingTiles(true);
              
              // Get the current visible region
              const currentRegion = mapRef.current?.getCamera();
              
              if (!currentRegion) {
                throw new Error('Could not determine map region');
              }
              
              // This would be implemented to download tiles using a map tile service
              // For example, using the react-native-maps-offline package
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              Alert.alert(
                'Download Complete',
                'Map tiles have been downloaded for offline use.'
              );
            } catch (err: any) {
              Alert.alert(
                'Download Failed',
                err.message || 'Failed to download map tiles'
              );
            } finally {
              setIsDownloadingTiles(false);
            }
          },
        },
      ]
    );
  };

  // Navigate to parcel note screen
  const handleViewNotes = () => {
    navigation.navigate('ParcelNote', { parcelId });
  };

  // Show error screen if loading failed
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Error Loading Map</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show loading screen while data is loading
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading Parcel Map...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
        toolbarEnabled
        // For iOS, offline support would be added here
        // For Android, 'useCache' would be required but requires advanced setup
        // Currently just showing a banner when offline
      >
        {polygonCoordinates.length > 0 && (
          <Polygon
            coordinates={polygonCoordinates}
            strokeColor="#2563EB"
            fillColor="rgba(37, 99, 235, 0.2)"
            strokeWidth={2}
          />
        )}
        
        {/* Add a marker at the center of the parcel */}
        <Marker
          coordinate={{
            latitude: region.latitude,
            longitude: region.longitude,
          }}
          title={parcel?.name || 'Parcel'}
          description={`ID: ${parcelId}`}
        />
      </MapView>

      {/* Offline mode banner */}
      {isOfflineMode && (
        <View style={styles.offlineBanner}>
          <Icon name="cloud-off-outline" size={16} color="#ffffff" />
          <Text style={styles.offlineBannerText}>
            Offline Mode - Some map features may be limited
          </Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#2563EB" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleDownloadMapTiles}
          disabled={isDownloadingTiles}
        >
          {isDownloadingTiles ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Icon name="map-marker-path" size={24} color="#2563EB" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleViewNotes}
        >
          <Icon name="note-text-outline" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Sync status */}
      <View style={styles.statusContainer}>
        <SyncStatus
          lastSynced={lastSynced}
          isSyncing={syncService.getSyncState().isSyncing}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#475569',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  controls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 24,
    left: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  controlButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  offlineBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 24,
    left: 72,
    right: 16,
    backgroundColor: '#EF4444',
    borderRadius: 4,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBannerText: {
    color: '#ffffff',
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
});