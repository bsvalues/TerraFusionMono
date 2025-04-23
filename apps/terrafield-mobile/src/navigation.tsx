import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import ParcelNoteScreen from './screens/ParcelNoteScreen';

export type RootStackParamList = {
  Home: undefined;
  ParcelNote: { parcelId: string };
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
          options={({ route }) => ({ title: `Parcel ${route.params.parcelId}` })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}