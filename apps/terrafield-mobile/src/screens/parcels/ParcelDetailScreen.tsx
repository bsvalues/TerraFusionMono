import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import apiService from '../../services/api.service';
import networkService from '../../services/network.service';

type ParcelStackParamList = {
  ParcelList: undefined;
  ParcelDetail: { parcelId: string };
  Map: undefined;
};

type ParcelDetailRouteProp = RouteProp<ParcelStackParamList, 'ParcelDetail'>;
type ParcelDetailScreenNavigationProp = StackNavigationProp<ParcelStackParamList, 'ParcelDetail'>;

interface Parcel {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  acres: number;
  assessedValue: number;
  ownerName: string;
  lastUpdate?: string;
  latitude?: number;
  longitude?: number;
  propertyType?: string;
  yearBuilt?: number;
  hasNotes?: boolean;
}

interface ParcelNote {
  id?: number;
  parcelId: string;
  text: string;
  createdAt?: string;
  updatedAt?: string;
}

const ParcelDetailScreen: React.FC = () => {
  const navigation = useNavigation<ParcelDetailScreenNavigationProp>();
  const route = useRoute<ParcelDetailRouteProp>();
  const { parcelId } = route.params;
  
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [note, setNote] = useState<ParcelNote | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadParcelData();
    
    // Subscribe to network status
    const unsubscribe = networkService.networkState$.subscribe(status => {
      setIsOnline(status.isConnected && status.isInternetReachable);
    });
    
    // Set initial network status
    setIsOnline(networkService.isOnline());
    
    return () => {
      unsubscribe();
    };
  }, [parcelId]);

  const loadParcelData = async () => {
    setIsLoading(true);
    try {
      // Get parcel details
      const parcelResponse = await apiService.request<any>(`/api/mobile/parcels/${parcelId}`, {
        method: 'GET',
      });
      
      if (parcelResponse.success && parcelResponse.data) {
        setParcel(parcelResponse.data);
        
        // Get parcel notes
        const noteResponse = await apiService.request<any>(`/api/mobile/parcels/${parcelId}/notes`, {
          method: 'GET',
        });
        
        if (noteResponse.success && noteResponse.data) {
          setNote(noteResponse.data);
          setNoteText(noteResponse.data.text || '');
        }
      } else {
        Alert.alert('Error', 'Failed to load parcel data');
      }
    } catch (error) {
      console.error('Error loading parcel data:', error);
      Alert.alert('Error', 'Failed to load parcel data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!parcel) return;
    
    setIsSaving(true);
    try {
      if (note && note.id) {
        // Update existing note
        const response = await apiService.request<any>(`/api/mobile/parcels/${parcelId}/notes/${note.id}`, {
          method: 'PATCH',
          body: { text: noteText },
        });
        
        if (response.success && response.data) {
          setNote(response.data);
          Alert.alert('Success', 'Note updated successfully');
        } else {
          Alert.alert('Error', 'Failed to update note');
        }
      } else {
        // Create new note
        const response = await apiService.request<any>(`/api/mobile/parcels/${parcelId}/notes`, {
          method: 'POST',
          body: { text: noteText },
        });
        
        if (response.success && response.data) {
          setNote(response.data);
          // Update parcel to reflect that it has notes
          setParcel({
            ...parcel,
            hasNotes: true
          });
          Alert.alert('Success', 'Note created successfully');
        } else {
          Alert.alert('Error', 'Failed to create note');
        }
      }
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note. Please try again later.');
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleViewOnMap = () => {
    if (parcel && parcel.latitude && parcel.longitude) {
      navigation.navigate('Map', { 
        initialRegion: {
          latitude: parcel.latitude,
          longitude: parcel.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        },
        focus: parcel.id
      });
    } else {
      Alert.alert('Error', 'No location data available for this parcel');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading parcel details...</Text>
      </SafeAreaView>
    );
  }

  if (!parcel) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="error-outline" size={64} color="#D32F2F" />
        <Text style={styles.errorTitle}>Parcel Not Found</Text>
        <Text style={styles.errorDescription}>
          The requested parcel could not be loaded or doesn't exist.
        </Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parcel Details</Text>
        <TouchableOpacity 
          style={styles.mapButton}
          onPress={handleViewOnMap}
        >
          <Icon name="map" size={24} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      {!isOnline && (
        <View style={styles.offlineNotice}>
          <Icon name="cloud-off" size={20} color="#F57C00" />
          <Text style={styles.offlineText}>You're working offline</Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        <View style={styles.addressCard}>
          <Text style={styles.addressText}>{parcel.address}</Text>
          <Text style={styles.cityStateText}>{parcel.city}, {parcel.state} {parcel.zipCode}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Owner</Text>
              <Text style={styles.infoValue}>{parcel.ownerName || 'Not available'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Property Type</Text>
              <Text style={styles.infoValue}>{parcel.propertyType || 'Not specified'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Year Built</Text>
              <Text style={styles.infoValue}>{parcel.yearBuilt || 'Unknown'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Assessed Value</Text>
              <Text style={styles.infoValue}>${parcel.assessedValue.toLocaleString()}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Acreage</Text>
              <Text style={styles.infoValue}>{parcel.acres.toFixed(2)} acres</Text>
            </View>
          </View>

          {parcel.lastUpdate && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Last Updated</Text>
                <Text style={styles.infoValue}>
                  {new Date(parcel.lastUpdate).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Text style={styles.notesTitle}>Notes</Text>
            {!isEditing ? (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Icon name="edit" size={20} color="#2E7D32" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveNote}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="save" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            <TextInput
              style={styles.noteInput}
              multiline
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Enter notes about this parcel..."
              placeholderTextColor="#999"
              editable={!isSaving}
            />
          ) : (
            <View style={styles.noteContent}>
              {noteText ? (
                <Text style={styles.noteText}>{noteText}</Text>
              ) : (
                <Text style={styles.emptyNoteText}>
                  No notes available for this parcel. Tap 'Edit' to add notes.
                </Text>
              )}
            </View>
          )}

          {note && note.updatedAt && !isEditing && (
            <Text style={styles.noteTimestamp}>
              Last updated: {new Date(note.updatedAt).toLocaleString()}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FA',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
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
  mapButton: {
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
  content: {
    flex: 1,
    padding: 16,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    alignItems: 'center',
  },
  addressText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  cityStateText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 12,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  editButtonText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  noteContent: {
    minHeight: 100,
  },
  noteText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  emptyNoteText: {
    fontSize: 16,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  noteInput: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  noteTimestamp: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 12,
    textAlign: 'right',
  },
  backButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default ParcelDetailScreen;