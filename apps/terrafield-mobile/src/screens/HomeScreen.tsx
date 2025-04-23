import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [parcelId, setParcelId] = useState('');
  const [recentParcels, setRecentParcels] = useState(['ABC123', 'DEF456', 'GHI789']);

  const handleOpenParcel = () => {
    if (parcelId.trim()) {
      navigation.navigate('ParcelNote', { parcelId: parcelId.trim() });
      
      // Add to recent parcels if not already there
      if (!recentParcels.includes(parcelId.trim())) {
        setRecentParcels([parcelId.trim(), ...recentParcels.slice(0, 4)]);
      }
      
      setParcelId('');
    }
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
      
      <Text style={styles.recentTitle}>Recent Parcels</Text>
      <FlatList
        data={recentParcels}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.recentItem}>
            <Text>{item}</Text>
            <Button 
              title="Open" 
              onPress={() => navigation.navigate('ParcelNote', { parcelId: item })} 
            />
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});