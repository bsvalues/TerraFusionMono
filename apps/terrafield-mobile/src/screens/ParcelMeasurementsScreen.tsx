import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import { parcelService } from '../services/parcel.service';
import { ParcelMeasurementData } from '../models/ParcelSchema';
import { realmObjectToPlain } from '../utils/realm';

// Extend the RootStackParamList in navigation.tsx to include this screen:
// ParcelMeasurements: { parcelId: string }

type ParcelMeasurementsRouteProp = RouteProp<RootStackParamList, 'ParcelMeasurements'>;

// Measurement types with descriptions
const MEASUREMENT_TYPES = [
  { id: 'soil_moisture', name: 'Soil Moisture', unit: '%' },
  { id: 'soil_temp', name: 'Soil Temperature', unit: '°C' },
  { id: 'soil_nitrogen', name: 'Nitrogen Level', unit: 'ppm' },
  { id: 'soil_phosphorus', name: 'Phosphorus Level', unit: 'ppm' },
  { id: 'soil_potassium', name: 'Potassium Level', unit: 'ppm' },
  { id: 'soil_ph', name: 'Soil pH', unit: 'pH' },
  { id: 'plant_height', name: 'Plant Height', unit: 'cm' },
  { id: 'plant_density', name: 'Plant Density', unit: 'plants/m²' },
  { id: 'leaf_color', name: 'Leaf Color (SPAD)', unit: 'SPAD' },
  { id: 'irrigation_volume', name: 'Irrigation Volume', unit: 'L/m²' },
];

export default function ParcelMeasurementsScreen() {
  const route = useRoute<ParcelMeasurementsRouteProp>();
  const navigation = useNavigation();
  const { parcelId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [parcel, setParcel] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<{id: string, name: string, unit: string} | null>(null);
  const [newMeasurement, setNewMeasurement] = useState<ParcelMeasurementData>({
    parcelId: '',
    measurementType: '',
    value: undefined,
    unit: '',
    userId: 1, // Default user ID, should come from auth in real app
    notes: '',
  });
  
  useEffect(() => {
    loadData();
  }, [parcelId]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const parcelData = parcelService.getParcel(parcelId);
      if (!parcelData) {
        Alert.alert('Error', 'Parcel not found');
        navigation.goBack();
        return;
      }
      
      setParcel(realmObjectToPlain(parcelData));
      
      // Load measurements
      const measurementData = parcelService.getMeasurements(parcelId);
      setMeasurements(measurementData.map(m => realmObjectToPlain(m)));
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load parcel data');
    } finally {
      setLoading(false);
    }
  };
  
  const openAddMeasurement = (type: {id: string, name: string, unit: string}) => {
    setSelectedType(type);
    setNewMeasurement({
      ...newMeasurement,
      parcelId,
      measurementType: type.id,
      unit: type.unit,
    });
    setModalVisible(true);
  };
  
  const saveMeasurement = () => {
    if (!selectedType) return;
    
    try {
      parcelService.saveMeasurement(newMeasurement);
      setModalVisible(false);
      
      // Reset form
      setNewMeasurement({
        parcelId: '',
        measurementType: '',
        value: undefined,
        unit: '',
        userId: 1,
        notes: '',
      });
      
      // Reload data
      loadData();
      
    } catch (error) {
      console.error('Error saving measurement:', error);
      Alert.alert('Error', 'Failed to save measurement');
    }
  };
  
  const renderMeasurementItem = ({ item }: { item: any }) => {
    const typeInfo = MEASUREMENT_TYPES.find(t => t.id === item.measurementType) || 
      { name: item.measurementType, unit: item.unit };
    
    return (
      <View style={styles.measurementItem}>
        <View style={styles.measurementHeader}>
          <Text style={styles.measurementType}>{typeInfo.name}</Text>
          <Text style={styles.measurementDate}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.measurementBody}>
          <Text style={styles.measurementValue}>
            {item.value} {typeInfo.unit}
          </Text>
          {item.notes && (
            <Text style={styles.measurementNotes}>{item.notes}</Text>
          )}
        </View>
        
        <View style={styles.measurementFooter}>
          <Text style={[styles.syncStatus, 
            item.syncStatus === 'pending' ? styles.pendingSync : styles.syncedStatus]}>
            {item.syncStatus === 'pending' ? '⏳ Pending sync' : '✓ Synced'}
          </Text>
        </View>
      </View>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading measurements...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{parcel?.name || `Parcel ${parcelId}`}</Text>
      
      <Text style={styles.sectionTitle}>Add New Measurement</Text>
      <View style={styles.measurementTypes}>
        <FlatList
          data={MEASUREMENT_TYPES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.typeButton}
              onPress={() => openAddMeasurement(item)}
            >
              <Text style={styles.typeButtonText}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      
      <Text style={styles.sectionTitle}>Recent Measurements</Text>
      {measurements.length === 0 ? (
        <Text style={styles.emptyText}>No measurements recorded yet.</Text>
      ) : (
        <FlatList
          data={measurements}
          keyExtractor={(item) => item.id}
          renderItem={renderMeasurementItem}
          contentContainerStyle={styles.measurementsList}
        />
      )}
      
      {/* Add Measurement Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Add {selectedType?.name} Measurement
            </Text>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Value ({selectedType?.unit})</Text>
              <TextInput
                style={styles.input}
                value={newMeasurement.value?.toString() || ''}
                onChangeText={(text) => 
                  setNewMeasurement({...newMeasurement, value: text ? parseFloat(text) : undefined})
                }
                keyboardType="decimal-pad"
                placeholder={`Enter value in ${selectedType?.unit}`}
              />
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newMeasurement.notes || ''}
                onChangeText={(text) => 
                  setNewMeasurement({...newMeasurement, notes: text})
                }
                placeholder="Add any observations or notes"
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveMeasurement}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  measurementTypes: {
    height: 50,
    marginBottom: 16,
  },
  typeButton: {
    backgroundColor: '#edf6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#0066cc',
  },
  typeButtonText: {
    color: '#0066cc',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
    color: '#666',
  },
  measurementsList: {
    paddingBottom: 16,
  },
  measurementItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  measurementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  measurementType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  measurementDate: {
    fontSize: 14,
    color: '#666',
  },
  measurementBody: {
    marginBottom: 8,
  },
  measurementValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  measurementNotes: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
  },
  measurementFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  syncStatus: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  pendingSync: {
    color: '#f5a623',
  },
  syncedStatus: {
    color: '#4cd964',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#0066cc',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});