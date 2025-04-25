import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import HomeScreen from './screens/HomeScreen';
import ParcelDetailScreen from './screens/ParcelDetailScreen';
import ParcelNoteScreen from './screens/ParcelNoteScreen';

// Define the navigator parameter list
export type RootStackParamList = {
  Home: undefined;
  ParcelDetail: { parcelId: string };
  ParcelNote: { parcelId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'TerraField Mobile' }}
        />
        <Stack.Screen
          name="ParcelDetail"
          component={ParcelDetailScreen}
          options={{ title: 'Parcel Details' }}
        />
        <Stack.Screen
          name="ParcelNote"
          component={ParcelNoteScreen}
          options={{ title: 'Parcel Notes' }}
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}