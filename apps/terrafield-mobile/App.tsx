import React, { useEffect } from 'react';
import { StyleSheet, SafeAreaView, LogBox, StatusBar, Platform } from 'react-native';
import Navigation from './src/navigation';
import { parcelService } from './src/services/parcel.service';

// Ignore yellow warning boxes in development (would fix in production)
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'Require cycle:',
  'new NativeEventEmitter',
  'Possible Unhandled Promise Rejection',
]);

export default function App() {
  // Set up demo user
  useEffect(() => {
    // Set token for demo user
    parcelService.setToken('demo-token');
    
    // In a real app, would check authentication state
    // and redirect to login if needed
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor="#0066cc"
      />
      <Navigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});