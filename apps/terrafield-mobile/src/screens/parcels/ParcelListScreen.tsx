import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import apiService from '../../services/api.service';
import networkService from '../../services/network.service';

type ParcelStackParamList = {
  ParcelList: undefined;
  ParcelDetail: { parcelId: string };
  Map: undefined;
};

type ParcelListScreenNavigationProp = StackNavigationProp<ParcelStackParamList, 'ParcelList'>;

interface Parcel {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  acres: number;
  assessedValue: number;
  ownerName: string;
  hasNotes?: boolean;
}

const ParcelListScreen: React.FC = () => {
  const navigation = useNavigation<ParcelListScreenNavigationProp>();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [filteredParcels, setFilteredParcels] = useState<Parcel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [sortOrder, setSortOrder] = useState<'address' | 'value' | 'size'>('address');

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
    filterParcels();
  }, [searchText, parcels, sortOrder]);

  const loadParcels = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.request<any>('/api/mobile/parcels', {
        method: 'GET',
      });

      if (response.success && response.data) {
        setParcels(response.data);
        setFilteredParcels(sortParcels(response.data, sortOrder));
      } else {
        Alert.alert('Error', 'Failed to load parcels');
      }
    } catch (error) {
      console.error('Error loading parcels:', error);
      Alert.alert('Error', 'Failed to load parcels. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadParcels();
    setIsRefreshing(false);
  };

  const filterParcels = () => {
    if (!searchText.trim()) {
      setFilteredParcels(sortParcels([...parcels], sortOrder));
      return;
    }
    
    const searchLower = searchText.toLowerCase();
    const filtered = parcels.filter(parcel => 
      parcel.address.toLowerCase().includes(searchLower) ||
      parcel.city.toLowerCase().includes(searchLower) ||
      parcel.state.toLowerCase().includes(searchLower) ||
      parcel.zipCode.toLowerCase().includes(searchLower) ||
      parcel.ownerName.toLowerCase().includes(searchLower)
    );
    
    setFilteredParcels(sortParcels(filtered, sortOrder));
  };

  const sortParcels = (parcelsToSort: Parcel[], order: 'address' | 'value' | 'size') => {
    switch (order) {
      case 'address':
        return [...parcelsToSort].sort((a, b) => a.address.localeCompare(b.address));
      case 'value':
        return [...parcelsToSort].sort((a, b) => b.assessedValue - a.assessedValue);
      case 'size':
        return [...parcelsToSort].sort((a, b) => b.acres - a.acres);
      default:
        return parcelsToSort;
    }
  };

  const handleSortChange = (newOrder: 'address' | 'value' | 'size') => {
    setSortOrder(newOrder);
    setFilteredParcels(sortParcels([...filteredParcels], newOrder));
  };

  const renderParcelItem = ({ item }: { item: Parcel }) => (
    <TouchableOpacity 
      style={styles.parcelCard}
      onPress={() => navigation.navigate('ParcelDetail', { parcelId: item.id })}
    >
      <View style={styles.parcelInfo}>
        <Text style={styles.parcelAddress}>{item.address}</Text>
        <Text style={styles.parcelLocation}>
          {item.city}, {item.state} {item.zipCode}
        </Text>
        <View style={styles.parcelMetrics}>
          <Text style={styles.parcelMetric}>
            <Icon name="straighten" size={14} color="#757575" /> {item.acres.toFixed(2)} acres
          </Text>
          <Text style={styles.parcelMetric}>
            <Icon name="attach-money" size={14} color="#757575" /> ${item.assessedValue.toLocaleString()}
          </Text>
        </View>
      </View>
      <View style={styles.parcelActions}>
        {item.hasNotes && (
          <Icon name="description" size={18} color="#2E7D32" style={styles.noteIcon} />
        )}
        <Icon name="chevron-right" size={24} color="#757575" />
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading parcels...</Text>
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
        <Text style={styles.headerTitle}>Parcels</Text>
        <TouchableOpacity 
          style={styles.mapButton}
          onPress={() => navigation.navigate('Map')}
        >
          <Icon name="map" size={24} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={24} color="#757575" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search parcels..."
            placeholderTextColor="#757575"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="clear" size={24} color="#757575" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {!isOnline && (
        <View style={styles.offlineNotice}>
          <Icon name="cloud-off" size={20} color="#F57C00" />
          <Text style={styles.offlineText}>You're working offline</Text>
        </View>
      )}

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity 
          style={[styles.sortButton, sortOrder === 'address' && styles.activeSortButton]}
          onPress={() => handleSortChange('address')}
        >
          <Text 
            style={[
              styles.sortButtonText, 
              sortOrder === 'address' && styles.activeSortButtonText
            ]}
          >
            Address
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.sortButton, sortOrder === 'value' && styles.activeSortButton]}
          onPress={() => handleSortChange('value')}
        >
          <Text 
            style={[
              styles.sortButtonText, 
              sortOrder === 'value' && styles.activeSortButtonText
            ]}
          >
            Value
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.sortButton, sortOrder === 'size' && styles.activeSortButton]}
          onPress={() => handleSortChange('size')}
        >
          <Text 
            style={[
              styles.sortButtonText, 
              sortOrder === 'size' && styles.activeSortButtonText
            ]}
          >
            Size
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredParcels}
        renderItem={renderParcelItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2E7D32']}
            tintColor="#2E7D32"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="search-off" size={64} color="#BDBDBD" />
            <Text style={styles.emptyTitle}>
              {searchText ? 'No matching parcels found' : 'No parcels available'}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchText 
                ? 'Try adjusting your search criteria'
                : 'Parcels will appear here when they are added'
              }
            </Text>
          </View>
        }
      />
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
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
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sortLabel: {
    fontSize: 14,
    color: '#757575',
    marginRight: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    marginRight: 8,
  },
  activeSortButton: {
    backgroundColor: '#E8F5E9',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#757575',
  },
  activeSortButtonText: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  parcelCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  parcelInfo: {
    flex: 1,
  },
  parcelAddress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  parcelLocation: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  parcelMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parcelMetric: {
    fontSize: 12,
    color: '#757575',
    marginRight: 12,
  },
  parcelActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteIcon: {
    marginRight: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#757575',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});

export default ParcelListScreen;