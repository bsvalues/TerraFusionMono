import React from 'react';
import { StyleSheet, SafeAreaView, LogBox, StatusBar, Platform } from 'react-native';
import Navigation from './src/navigation';

// Ignore yellow warning boxes in development (would fix in production)
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'Require cycle:',
  'new NativeEventEmitter',
  'Possible Unhandled Promise Rejection',
]);

export default function App() {
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