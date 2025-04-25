import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  TouchableOpacity,
  TextInput,
  Button,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { PhotoSyncService } from '../services/PhotoSyncService';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const API_BASE_URL = 'https://terrafield-api.example.com'; // This would be set in a config file

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<Array<{ id: string, address: string }>>([
    { id: '1001', address: '123 Main St, New York, NY' },
    { id: '1002', address: '456 Oak Ave, Chicago, IL' },
    { id: '1003', address: '789 Pine Rd, Los Angeles, CA' }
  ]);
  const [searchText, setSearchText] = useState('');
  const [syncStatus, setSyncStatus] = useState<{[key: string]: 'synced' | 'pending' | 'error'}>({});

  useEffect(() => {
    // Initialize the PhotoSyncService
    const syncService = PhotoSyncService.getInstance(API_BASE_URL);
    
    // Load the sync status for each report
    reports.forEach(report => {
      const pendingPhotos = syncService.getPendingPhotos(report.id);
      if (pendingPhotos.length > 0) {
        setSyncStatus(prev => ({
          ...prev,
          [report.id]: 'pending'
        }));
      } else {
        setSyncStatus(prev => ({
          ...prev,
          [report.id]: 'synced'
        }));
      }
    });
  }, [reports]);

  const syncReport = async (reportId: string) => {
    setLoading(true);
    setSyncStatus(prev => ({
      ...prev,
      [reportId]: 'pending'
    }));
    
    try {
      const syncService = PhotoSyncService.getInstance(API_BASE_URL);
      await syncService.syncReport(reportId);
      
      setSyncStatus(prev => ({
        ...prev,
        [reportId]: 'synced'
      }));
      
      Alert.alert('Sync Successful', `Report ${reportId} synced successfully.`);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus(prev => ({
        ...prev,
        [reportId]: 'error'
      }));
      
      Alert.alert('Sync Failed', `Failed to sync report ${reportId}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const navigateToDetail = (reportId: string) => {
    navigation.navigate('ParcelDetail', { parcelId: reportId });
  };

  const navigateToNotes = (reportId: string) => {
    navigation.navigate('ParcelNote', { parcelId: reportId });
  };

  const filteredReports = reports.filter(report => 
    report.address.toLowerCase().includes(searchText.toLowerCase()) ||
    report.id.includes(searchText)
  );

  const renderSyncStatus = (reportId: string) => {
    const status = syncStatus[reportId] || 'synced';
    
    switch (status) {
      case 'synced':
        return <Text style={styles.syncedStatus}>✓ Synced</Text>;
      case 'pending':
        return <Text style={styles.pendingStatus}>⟳ Pending</Text>;
      case 'error':
        return <Text style={styles.errorStatus}>⚠ Error</Text>;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TerraField Mobile</Text>
      <Text style={styles.subtitle}>Field Data Collection & Synchronization</Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by address or ID"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      
      {loading && (
        <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
      )}
      
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>Your Assignments</Text>
        <Text style={styles.listCount}>{filteredReports.length} Reports</Text>
      </View>
      
      <FlatList
        data={filteredReports}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.reportCard}>
            <View style={styles.reportInfo}>
              <Text style={styles.reportId}>Report #{item.id}</Text>
              <Text style={styles.reportAddress}>{item.address}</Text>
              {renderSyncStatus(item.id)}
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigateToDetail(item.id)}
              >
                <Text style={styles.buttonText}>Details</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigateToNotes(item.id)}
              >
                <Text style={styles.buttonText}>Notes</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.syncButton, 
                  syncStatus[item.id] === 'error' ? styles.errorButton : {}
                ]}
                onPress={() => syncReport(item.id)}
                disabled={loading || syncStatus[item.id] === 'synced'}
              >
                <Text style={styles.buttonText}>
                  {syncStatus[item.id] === 'synced' ? 'Synced' : 'Sync Now'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listCount: {
    fontSize: 14,
    color: '#666',
  },
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reportInfo: {
    marginBottom: 12,
  },
  reportId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportAddress: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  syncButton: {
    backgroundColor: '#009900',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  errorButton: {
    backgroundColor: '#cc0000',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 20,
  },
  syncedStatus: {
    color: '#009900',
    marginTop: 4,
  },
  pendingStatus: {
    color: '#ff9900',
    marginTop: 4,
  },
  errorStatus: {
    color: '#cc0000',
    marginTop: 4,
  },
});