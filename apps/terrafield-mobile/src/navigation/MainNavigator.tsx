import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import HomeScreen from '../screens/main/HomeScreen';
import ParcelListScreen from '../screens/parcels/ParcelListScreen';
import ParcelDetailScreen from '../screens/parcels/ParcelDetailScreen';
import MapScreen from '../screens/map/MapScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

// Define the types for the main tab navigator
export type MainTabParamList = {
  HomeTab: undefined;
  ParcelTab: undefined;
  MapTab: undefined;
  SettingsTab: undefined;
};

// Define the types for the stack navigators inside tabs
export type HomeStackParamList = {
  Home: undefined;
  Settings: undefined;
};

export type ParcelStackParamList = {
  ParcelList: undefined;
  ParcelDetail: { parcelId: string };
};

export type MapStackParamList = {
  Map: { initialRegion?: any; focus?: string } | undefined;
  ParcelDetail: { parcelId: string };
};

export type SettingsStackParamList = {
  Settings: undefined;
};

// Create navigators
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const ParcelStack = createStackNavigator<ParcelStackParamList>();
const MapStack = createStackNavigator<MapStackParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();

// Home stack navigator
const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F5F8FA' },
      }}
    >
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Settings" component={SettingsScreen} />
    </HomeStack.Navigator>
  );
};

// Parcel stack navigator
const ParcelStackNavigator = () => {
  return (
    <ParcelStack.Navigator
      initialRouteName="ParcelList"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F5F8FA' },
      }}
    >
      <ParcelStack.Screen name="ParcelList" component={ParcelListScreen} />
      <ParcelStack.Screen name="ParcelDetail" component={ParcelDetailScreen} />
    </ParcelStack.Navigator>
  );
};

// Map stack navigator
const MapStackNavigator = () => {
  return (
    <MapStack.Navigator
      initialRouteName="Map"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F5F8FA' },
      }}
    >
      <MapStack.Screen name="Map" component={MapScreen} />
      <MapStack.Screen name="ParcelDetail" component={ParcelDetailScreen} />
    </MapStack.Navigator>
  );
};

// Settings stack navigator
const SettingsStackNavigator = () => {
  return (
    <SettingsStack.Navigator
      initialRouteName="Settings"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F5F8FA' },
      }}
    >
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
    </SettingsStack.Navigator>
  );
};

// Main tab navigator
const MainNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E0E0E0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'HomeTab':
              iconName = 'home';
              break;
            case 'ParcelTab':
              iconName = 'view-list';
              break;
            case 'MapTab':
              iconName = 'map';
              break;
            case 'SettingsTab':
              iconName = 'settings';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStackNavigator} 
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="ParcelTab" 
        component={ParcelStackNavigator} 
        options={{ tabBarLabel: 'Parcels' }}
      />
      <Tab.Screen 
        name="MapTab" 
        component={MapStackNavigator} 
        options={{ tabBarLabel: 'Map' }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsStackNavigator} 
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;