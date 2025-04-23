import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

// Screens
import HomeScreen from './screens/HomeScreen';
import ParcelNoteScreen from './screens/ParcelNoteScreen';
import ParcelAgDataScreen from './screens/ParcelAgDataScreen';
import ParcelMeasurementsScreen from './screens/ParcelMeasurementsScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';

// Services
import { authService } from './services/auth.service';
import { parcelService } from './services/parcel.service';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  Home: undefined;
  Profile: undefined;
  ParcelNote: { parcelId: string };
  ParcelAgData: { parcelId: string };
  ParcelMeasurements: { parcelId: string };
};

export type TabParamList = {
  Home: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Bottom tabs navigation
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          } else {
            iconName = 'circle';
          }
          
          return <Feather name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      
      try {
        // Attempt to restore authentication state
        const hasSession = await authService.initialize();
        setIsAuthenticated(hasSession);
        
        if (hasSession) {
          // Set token for parcel service
          const token = authService.getToken();
          if (token) {
            parcelService.setToken(token);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);
  
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#6c757d' }}>
          Loading TerraField...
        </Text>
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={isAuthenticated ? "MainTabs" : "Login"}
        screenOptions={{ headerShown: true }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ParcelNote" 
          component={ParcelNoteScreen} 
          options={({ route }) => ({ title: `Notes: ${route.params.parcelId}` })}
        />
        <Stack.Screen 
          name="ParcelAgData" 
          component={ParcelAgDataScreen} 
          options={({ route }) => ({ title: `Field Data: ${route.params.parcelId}` })}
        />
        <Stack.Screen 
          name="ParcelMeasurements" 
          component={ParcelMeasurementsScreen} 
          options={({ route }) => ({ title: `Measurements: ${route.params.parcelId}` })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}