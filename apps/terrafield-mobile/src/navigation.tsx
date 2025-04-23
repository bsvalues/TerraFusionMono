import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import ParcelNoteScreen from './screens/ParcelNoteScreen';
import ParcelAgDataScreen from './screens/ParcelAgDataScreen';
import ParcelMeasurementsScreen from './screens/ParcelMeasurementsScreen';

export type RootStackParamList = {
  Home: undefined;
  ParcelNote: { parcelId: string };
  ParcelAgData: { parcelId: string };
  ParcelMeasurements: { parcelId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'TerraField' }} />
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