import React, { useState, useEffect } from 'react';
import { StatusBar, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AuthNavigator from './navigation/AuthNavigator';
import MainNavigator from './navigation/MainNavigator';
import authService from './services/auth.service';
import apiService from './services/api.service';
import syncService from './services/sync.service';
import networkService from './services/network.service';
import Config from './config';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize app services
    const initializeApp = async () => {
      try {
        // Initialize network service
        await networkService.initialize();
        
        // Initialize API service
        await apiService.initialize();
        
        // Initialize sync service
        await syncService.initialize();
        
        // Check authentication status
        const isLoggedIn = await authService.isAuthenticated();
        setIsAuthenticated(isLoggedIn);
        
        // If authenticated, perform initial sync
        if (isLoggedIn && networkService.isOnline()) {
          try {
            await syncService.performSync();
          } catch (syncError) {
            console.warn('Initial sync error:', syncError);
            // Non-fatal, continue with app initialization
          }
        }
      } catch (error) {
        console.error('App initialization error:', error);
        setInitError('Failed to initialize app. Please restart.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
    
    // Subscribe to auth events
    const authSubscription = authService.authState$.subscribe((authState) => {
      setIsAuthenticated(authState.isAuthenticated);
    });
    
    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading TerraField...</Text>
        <Text style={styles.versionText}>Version {Config.VERSION}</Text>
      </View>
    );
  }

  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Text style={styles.errorText}>{initError}</Text>
        <Text style={styles.versionText}>Version {Config.VERSION}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <NavigationContainer>
          {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FA',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 24,
  },
  versionText: {
    position: 'absolute',
    bottom: 24,
    fontSize: 12,
    color: '#9E9E9E',
  },
});

export default App;