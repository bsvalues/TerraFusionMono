import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';

type ParcelNoteRouteProp = RouteProp<RootStackParamList, 'ParcelNote'>;

export default function ParcelNoteScreen() {
  const route = useRoute<ParcelNoteRouteProp>();
  const { parcelId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parcel {parcelId}</Text>
      <Text>Note editor will be implemented in Step 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});