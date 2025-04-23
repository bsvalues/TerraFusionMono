import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Button, 
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
  Switch
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import { useParcelNote } from '../hooks/useParcelNote';

type ParcelNoteRouteProp = RouteProp<RootStackParamList, 'ParcelNote'>;

export default function ParcelNoteScreen() {
  const route = useRoute<ParcelNoteRouteProp>();
  const { parcelId } = route.params;
  const [isAirplaneModeSimulated, setIsAirplaneModeSimulated] = useState(false);

  const { 
    note, 
    setNote, 
    isLoading, 
    isSyncing, 
    error, 
    lastSynced, 
    sync 
  } = useParcelNote(parcelId);

  const handleSync = async () => {
    if (isAirplaneModeSimulated) {
      Alert.alert(
        "Offline Mode",
        "Device is currently offline. Changes will sync when you're back online.",
        [{ text: "OK" }]
      );
      return;
    }
    
    try {
      await sync();
    } catch (e) {
      Alert.alert("Sync Failed", e.message);
    }
  };

  const toggleAirplaneMode = () => {
    setIsAirplaneModeSimulated(!isAirplaneModeSimulated);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading parcel note...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.parcelId}>Parcel ID: {parcelId}</Text>
        <Text style={styles.syncStatus}>
          {lastSynced 
            ? `Last synced: ${lastSynced.toLocaleTimeString()}` 
            : 'Not synced yet'}
        </Text>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <ScrollView style={styles.editorContainer}>
        <TextInput
          style={styles.editor}
          multiline
          value={note}
          onChangeText={setNote}
          placeholder="Enter notes about this parcel..."
        />
      </ScrollView>
      
      <View style={styles.footer}>
        <View style={styles.airplaneModeContainer}>
          <Text>Simulate Offline Mode</Text>
          <Switch
            value={isAirplaneModeSimulated}
            onValueChange={toggleAirplaneMode}
          />
        </View>
        
        <Button
          title={isSyncing ? "Syncing..." : "Sync Now"}
          onPress={handleSync}
          disabled={isSyncing}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    marginBottom: 16,
  },
  parcelId: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  syncStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
  },
  editorContainer: {
    flex: 1,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  editor: {
    flex: 1,
    padding: 8,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 200,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  airplaneModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});