import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { parcelService } from '../services/parcel.service';
import { realmObjectToPlain } from '../utils/realm';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [parcelId, setParcelId] = useState('');
  const [loading, setLoading] = useState(true);
  const [parcels, setParcels] = useState<any[]>([]);
  
  useEffect(() => {
    loadParcels();
  }, []);
  
  const loadParcels = async () => {
    setLoading(true);
    try {
      // In a real app, would fetch from server first, then local
      const localParcels = parcelService.getParcelsFromRealm();
      setParcels(localParcels);
      
      // Mock fetching from server
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading parcels:', error);
      Alert.alert('Error', 'Failed to load parcels');
      setLoading(false);
    }
  };

  const handleOpenParcel = () => {
    if (parcelId.trim()) {
      // Go to Parcel Notes by default
      navigation.navigate('ParcelNote', { parcelId: parcelId.trim() });
      setParcelId('');
    }
  };
  
  const renderParcelItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.parcelItem}>
        <View style={styles.parcelHeader}>
          <Text style={styles.parcelName}>{item.name}</Text>
          <Text style={[styles.parcelStatus, 
            item.status === 'active' ? styles.statusActive : styles.statusInactive]}>
            {item.status === 'active' ? '● Active' : '○ Inactive'}
          </Text>
        </View>
        
        <Text style={styles.parcelId}>ID: {item.externalId}</Text>
        
        {item.soilType && (
          <Text style={styles.parcelDetail}>Soil: {item.soilType}</Text>
        )}
        
        {item.currentCrop && (
          <Text style={styles.parcelDetail}>Crop: {item.currentCrop}</Text>
        )}
        
        <View style={styles.parcelButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.notesButton]}
            onPress={() => navigation.navigate('ParcelNote', { parcelId: item.externalId })}
          >
            <Text style={styles.buttonText}>Notes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dataButton]}
            onPress={() => navigation.navigate('ParcelAgData', { parcelId: item.externalId })}
          >
            <Text style={styles.buttonText}>Ag Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.measureButton]}
            onPress={() => navigation.navigate('ParcelMeasurements', { parcelId: item.externalId })}
          >
            <Text style={styles.buttonText}>Measurements</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.syncInfo}>
          <Text style={styles.syncText}>
            {item.syncStatus === 'pending' ? '⏳ Pending sync' : '✓ Synced'}
          </Text>
          {item.lastSynced && (
            <Text style={styles.syncTime}>
              Last: {new Date(item.lastSynced).toLocaleString()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TerraField Mobile</Text>
      <Text style={styles.subtitle}>Offline-First Field Companion</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter Parcel ID"
          value={parcelId}
          onChangeText={setParcelId}
          autoCapitalize="characters"
        />
        <Button title="Open" onPress={handleOpenParcel} />
      </View>
      
      <Text style={styles.listTitle}>Your Parcels</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading parcels...</Text>
        </View>
      ) : parcels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No parcels found.</Text>
          <Text style={styles.emptySubtext}>
            Enter a parcel ID above to open a specific parcel, 
            or sync with the server to load your parcels.
          </Text>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={loadParcels}
          >
            <Text style={styles.syncButtonText}>Sync Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={parcels}
          keyExtractor={(item) => item.externalId}
          renderItem={renderParcelItem}
          contentContainerStyle={styles.parcelList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#7f8c8d',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c3e50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    marginBottom: 24,
  },
  syncButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  parcelList: {
    paddingBottom: 16,
  },
  parcelItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  parcelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  parcelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  parcelStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusActive: {
    color: '#27ae60',
  },
  statusInactive: {
    color: '#e74c3c',
  },
  parcelId: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  parcelDetail: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 4,
  },
  parcelButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  notesButton: {
    backgroundColor: '#3498db',
  },
  dataButton: {
    backgroundColor: '#2ecc71',
  },
  measureButton: {
    backgroundColor: '#9b59b6',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  syncInfo: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 8,
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  syncText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  syncTime: {
    fontSize: 12,
    color: '#95a5a6',
  },
});