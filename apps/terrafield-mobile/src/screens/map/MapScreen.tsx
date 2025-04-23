import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import apiService from '../../services/api.service';
import networkService from '../../services/network.service';

type MapStackParamList = {
  ParcelList: undefined;
  ParcelDetail: { parcelId: string };
  Map: { initialRegion?: Region; focus?: string } | undefined;
};

type MapRouteProp = RouteProp<MapStackParamList, 'Map'>;
type MapScreenNavigationProp = StackNavigationProp<MapStackParamList, 'Map'>;

interface Parcel {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  ownerName?: string;
  hasNotes?: boolean;
}

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const MapScreen: React.FC = () => {
  const navigation = useNavigation<MapScreenNavigationProp>();
  const route = useRoute<MapRouteProp>();
  const mapRef = useRef<MapView>(null);
  
  const initialRegion = route.params?.initialRegion || {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  };
  
  const focusParcelId = route.params?.focus;
  
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    loadParcels();
    
    // Subscribe to network status
    const unsubscribe = networkService.networkState$.subscribe(status => {
      setIsOnline(status.isConnected && status.isInternetReachable);
    });
    
    // Set initial network status
    setIsOnline(networkService.isOnline());
    
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    // If a specific parcel ID is provided for focus, select it
    if (focusParcelId && parcels.length > 0) {
      const parcelToFocus = parcels.find(p => p.id === focusParcelId);
      if (parcelToFocus) {
        setSelectedParcel(parcelToFocus);
        focusOnParcel(parcelToFocus);
      }
    }
  }, [focusParcelId, parcels]);

  const loadParcels = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.request<any>('/api/mobile/parcels', {
        method: 'GET',
      });
      
      if (response.success && response.data) {
        // Filter to only include parcels with valid coordinates
        const validParcels = response.data.filter((p: any) => 
          p.latitude && p.longitude && 
          !isNaN(p.latitude) && !isNaN(p.longitude)
        );
        
        setParcels(validParcels);
      } else {
        Alert.alert('Error', 'Failed to load parcel data for map');
      }
    } catch (error) {
      console.error('Error loading parcels for map:', error);
      Alert.alert('Error', 'Failed to load map data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const focusOnParcel = (parcel: Parcel) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: parcel.latitude,
        longitude: parcel.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const handleMarkerPress = (parcel: Parcel) => {
    setSelectedParcel(parcel);
    focusOnParcel(parcel);
  };

  const handleViewParcelDetails = () => {
    if (selectedParcel) {
      navigation.navigate('ParcelDetail', { parcelId: selectedParcel.id });
    }
  };

  const handleGetUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }
      },
      error => {
        console.error(error);
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please check your location permissions.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Map View</Text>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={handleGetUserLocation}
        >
          <Icon name="my-location" size={24} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      {!isOnline && (
        <View style={styles.offlineNotice}>
          <Icon name="cloud-off" size={20} color="#F57C00" />
          <Text style={styles.offlineText}>You're working offline</Text>
        </View>
      )}

      <View style={styles.mapContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>Loading map data...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
            showsScale={true}
            showsBuildings={true}
            showsTraffic={false}
            showsIndoors={false}
          >
            {parcels.map(parcel => (
              <Marker
                key={parcel.id}
                coordinate={{
                  latitude: parcel.latitude,
                  longitude: parcel.longitude,
                }}
                title={parcel.address}
                description={`${parcel.city}, ${parcel.state}`}
                onPress={() => handleMarkerPress(parcel)}
                pinColor={selectedParcel?.id === parcel.id ? '#2E7D32' : '#FF5722'}
              />
            ))}
            {userLocation && (
              <Marker
                coordinate={userLocation}
                title="Your Location"
                pinColor="#2196F3"
              />
            )}
          </MapView>
        )}
      </View>

      {selectedParcel && (
        <View style={styles.parcelCard}>
          <View style={styles.parcelInfo}>
            <Text style={styles.parcelAddress}>{selectedParcel.address}</Text>
            <Text style={styles.parcelLocation}>
              {selectedParcel.city}, {selectedParcel.state}
            </Text>
            {selectedParcel.ownerName && (
              <Text style={styles.parcelOwner}>Owner: {selectedParcel.ownerName}</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={handleViewParcelDetails}
          >
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  locationButton: {
    padding: 8,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 8,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  offlineText: {
    color: '#E65100',
    marginLeft: 8,
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#757575',
  },
  parcelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  parcelInfo: {
    flex: 1,
  },
  parcelAddress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  parcelLocation: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  parcelOwner: {
    fontSize: 12,
    color: '#757575',
  },
  viewButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default MapScreen;