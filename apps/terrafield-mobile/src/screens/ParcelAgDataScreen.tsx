import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Button,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import { parcelService } from '../services/parcel.service';
import { realmObjectToPlain } from '../utils/realm';

// Extend the RootStackParamList in navigation.tsx to include this screen:
// ParcelAgData: { parcelId: string }

type ParcelAgDataRouteProp = RouteProp<RootStackParamList, 'ParcelAgData'>;

interface SoilData {
  soilType: string;
  soilPh: string;
  soilOrganicMatter: string;
}

interface CropData {
  currentCrop: string;
  previousCrop: string;
  plantingDate: string;
  harvestDate: string;
}

interface IrrigationData {
  irrigationType: string;
  waterSource: string;
}

export default function ParcelAgDataScreen() {
  const route = useRoute<ParcelAgDataRouteProp>();
  const navigation = useNavigation();
  const { parcelId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parcel, setParcel] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'soil' | 'crop' | 'irrigation'>('soil');
  
  // Form state
  const [soilData, setSoilData] = useState<SoilData>({
    soilType: '',
    soilPh: '',
    soilOrganicMatter: '',
  });
  
  const [cropData, setCropData] = useState<CropData>({
    currentCrop: '',
    previousCrop: '',
    plantingDate: '',
    harvestDate: '',
  });
  
  const [irrigationData, setIrrigationData] = useState<IrrigationData>({
    irrigationType: '',
    waterSource: '',
  });
  
  useEffect(() => {
    loadParcelData();
  }, [parcelId]);
  
  const loadParcelData = () => {
    setLoading(true);
    try {
      const parcelData = parcelService.getParcel(parcelId);
      if (!parcelData) {
        Alert.alert('Error', 'Parcel not found');
        navigation.goBack();
        return;
      }
      
      const plainParcel = realmObjectToPlain(parcelData);
      setParcel(plainParcel);
      
      // Initialize form data from parcel
      setSoilData({
        soilType: plainParcel.soilType || '',
        soilPh: plainParcel.soilPh?.toString() || '',
        soilOrganicMatter: plainParcel.soilOrganicMatter?.toString() || '',
      });
      
      setCropData({
        currentCrop: plainParcel.currentCrop || '',
        previousCrop: plainParcel.previousCrop || '',
        plantingDate: plainParcel.plantingDate ? formatDate(plainParcel.plantingDate) : '',
        harvestDate: plainParcel.harvestDate ? formatDate(plainParcel.harvestDate) : '',
      });
      
      setIrrigationData({
        irrigationType: plainParcel.irrigationType || '',
        waterSource: plainParcel.waterSource || '',
      });
    } catch (error) {
      console.error('Error loading parcel data:', error);
      Alert.alert('Error', 'Failed to load parcel data');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    
    try {
      return new Date(dateString);
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  };
  
  const saveSoilData = () => {
    if (saving || !parcel) return;
    
    setSaving(true);
    try {
      parcelService.updateParcelAgData(parcelId, {
        soilType: soilData.soilType,
        soilPh: soilData.soilPh ? parseFloat(soilData.soilPh) : null,
        soilOrganicMatter: soilData.soilOrganicMatter ? parseFloat(soilData.soilOrganicMatter) : null,
      });
      
      Alert.alert('Success', 'Soil data saved');
      loadParcelData(); // Refresh data
    } catch (error) {
      console.error('Error saving soil data:', error);
      Alert.alert('Error', 'Failed to save soil data');
    } finally {
      setSaving(false);
    }
  };
  
  const saveCropData = () => {
    if (saving || !parcel) return;
    
    setSaving(true);
    try {
      parcelService.updateParcelAgData(parcelId, {
        currentCrop: cropData.currentCrop,
        previousCrop: cropData.previousCrop,
        plantingDate: parseDate(cropData.plantingDate),
        harvestDate: parseDate(cropData.harvestDate),
      });
      
      Alert.alert('Success', 'Crop data saved');
      loadParcelData(); // Refresh data
    } catch (error) {
      console.error('Error saving crop data:', error);
      Alert.alert('Error', 'Failed to save crop data');
    } finally {
      setSaving(false);
    }
  };
  
  const saveIrrigationData = () => {
    if (saving || !parcel) return;
    
    setSaving(true);
    try {
      parcelService.updateParcelAgData(parcelId, {
        irrigationType: irrigationData.irrigationType,
        waterSource: irrigationData.waterSource,
      });
      
      Alert.alert('Success', 'Irrigation data saved');
      loadParcelData(); // Refresh data
    } catch (error) {
      console.error('Error saving irrigation data:', error);
      Alert.alert('Error', 'Failed to save irrigation data');
    } finally {
      setSaving(false);
    }
  };
  
  // Helper for rendering input fields
  const renderField = (label: string, value: string, onChangeText: (text: string) => void, keyboardType: any = 'default') => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading parcel data...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{parcel?.name || `Parcel ${parcelId}`}</Text>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'soil' && styles.activeTab]}
          onPress={() => setActiveTab('soil')}
        >
          <Text style={[styles.tabText, activeTab === 'soil' && styles.activeTabText]}>Soil</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'crop' && styles.activeTab]}
          onPress={() => setActiveTab('crop')}
        >
          <Text style={[styles.tabText, activeTab === 'crop' && styles.activeTabText]}>Crop</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'irrigation' && styles.activeTab]}
          onPress={() => setActiveTab('irrigation')}
        >
          <Text style={[styles.tabText, activeTab === 'irrigation' && styles.activeTabText]}>Irrigation</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.formContainer}>
        {activeTab === 'soil' && (
          <View>
            {renderField('Soil Type', soilData.soilType, (text) => setSoilData({...soilData, soilType: text}))}
            {renderField('Soil pH', soilData.soilPh, (text) => setSoilData({...soilData, soilPh: text}), 'decimal-pad')}
            {renderField('Organic Matter (%)', soilData.soilOrganicMatter, (text) => setSoilData({...soilData, soilOrganicMatter: text}), 'decimal-pad')}
            
            <Button
              title={saving ? "Saving..." : "Save Soil Data"}
              onPress={saveSoilData}
              disabled={saving}
            />
          </View>
        )}
        
        {activeTab === 'crop' && (
          <View>
            {renderField('Current Crop', cropData.currentCrop, (text) => setCropData({...cropData, currentCrop: text}))}
            {renderField('Previous Crop', cropData.previousCrop, (text) => setCropData({...cropData, previousCrop: text}))}
            {renderField('Planting Date (YYYY-MM-DD)', cropData.plantingDate, (text) => setCropData({...cropData, plantingDate: text}))}
            {renderField('Harvest Date (YYYY-MM-DD)', cropData.harvestDate, (text) => setCropData({...cropData, harvestDate: text}))}
            
            <Button
              title={saving ? "Saving..." : "Save Crop Data"}
              onPress={saveCropData}
              disabled={saving}
            />
          </View>
        )}
        
        {activeTab === 'irrigation' && (
          <View>
            {renderField('Irrigation Type', irrigationData.irrigationType, (text) => setIrrigationData({...irrigationData, irrigationType: text}))}
            {renderField('Water Source', irrigationData.waterSource, (text) => setIrrigationData({...irrigationData, waterSource: text}))}
            
            <Button
              title={saving ? "Saving..." : "Save Irrigation Data"}
              onPress={saveIrrigationData}
              disabled={saving}
            />
          </View>
        )}
      </ScrollView>
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0066cc',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#0066cc',
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
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
});