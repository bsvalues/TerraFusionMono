import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigation } from './src/navigation';
import { syncService } from './src/services/sync.service';

export default function App() {
  // Initialize services on app startup
  useEffect(() => {
    const initializeServices = async () => {
      // Initialize sync service
      await syncService.initialize();
    };
    
    initializeServices();
    
    // Cleanup on unmount (though this is unlikely to be called in a real app)
    return () => {
      syncService.destroy();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigation />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}