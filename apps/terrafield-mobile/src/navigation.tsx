import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ParcelMapScreen } from './screens/ParcelMapScreen';
import { ParcelNoteScreen } from './screens/ParcelNoteScreen';
import { SettingsScreen } from './screens/SettingsScreen';

// Auth context
import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from './services/auth.service';

// Create the navigation stacks
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth context
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

// Main tab navigator (shown when authenticated)
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#E2E8F0',
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 4,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// App navigation container
export function AppNavigation() {
  const [authState, setAuthState] = useState<AuthContextType>({
    isAuthenticated: false,
    isLoading: true,
  });

  // Subscribe to auth changes
  useEffect(() => {
    const unsubscribe = authService.subscribe((state) => {
      setAuthState({
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
      });
    });
    
    return unsubscribe;
  }, []);

  // Show splash screen while loading
  if (authState.isLoading) {
    return null; // Replace with a SplashScreen component in the future
  }

  return (
    <AuthContext.Provider value={authState}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#f5f7fa' },
          }}
        >
          {!authState.isAuthenticated ? (
            // Auth screens
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }}
            />
          ) : (
            // Main app screens
            <>
              <Stack.Screen 
                name="Main" 
                component={MainTabNavigator} 
              />
              <Stack.Screen 
                name="ParcelMap" 
                component={ParcelMapScreen}
              />
              <Stack.Screen 
                name="ParcelNote" 
                component={ParcelNoteScreen} 
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}