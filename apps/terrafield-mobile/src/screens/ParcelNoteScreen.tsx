import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import * as Y from 'yjs';
import { encode, decode } from 'base64-arraybuffer';

// Note: In a real app, would implement Y.js custom React Native functionality

type ParcelNoteScreenRouteProp = RouteProp<RootStackParamList, 'ParcelNote'>;

export default function ParcelNoteScreen() {
  const route = useRoute<ParcelNoteScreenRouteProp>();
  const navigation = useNavigation();
  const { parcelId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [ydoc] = useState(() => new Y.Doc());
  const [ytext] = useState(() => ydoc.getText('note'));
  
  useEffect(() => {
    loadNoteData();
    
    // Set up Y.js handling
    ytext.observe(event => {
      setNoteText(ytext.toString());
    });
    
    return () => {
      // Clean up Y.js observers if needed
    };
  }, []);
  
  const loadNoteData = async () => {
    setLoading(true);
    
    try {
      // In a real app, would fetch from Realm and server
      setTimeout(() => {
        // Mock data
        const sampleText = `Notes for Parcel ${parcelId}:\n` +
          `- Initial field survey completed\n` +
          `- Topsoil appears to be loamy\n` +
          `- West section has slightly better drainage\n`;
        
        setNoteText(sampleText);
        ytext.delete(0, ytext.length);
        ytext.insert(0, sampleText);
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading note:', error);
      Alert.alert('Error', 'Failed to load note data');
      setLoading(false);
    }
  };
  
  const saveNote = async () => {
    if (saving) return;
    
    setSaving(true);
    Keyboard.dismiss();
    
    try {
      // In a real app, would save to Realm and queue for sync
      setTimeout(() => {
        // Simulate saving process
        const update = encode(Y.encodeStateAsUpdate(ydoc));
        console.log('Encoded update size:', update.length);
        
        Alert.alert('Success', 'Note saved successfully');
        setSaving(false);
      }, 1000);
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note');
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading note...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notes for Parcel {parcelId}</Text>
      
      <ScrollView style={styles.editorContainer}>
        <TextInput
          style={styles.editor}
          value={noteText}
          onChangeText={(text) => {
            // Update Y.js document when text changes
            const currentText = ytext.toString();
            if (text !== currentText) {
              ytext.delete(0, ytext.length);
              ytext.insert(0, text);
            }
            setNoteText(text);
          }}
          multiline={true}
          autoCapitalize="sentences"
          placeholder="Enter notes about this parcel..."
        />
      </ScrollView>
      
      <View style={styles.toolbarContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonSecondaryText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.buttonPrimary, saving && styles.buttonDisabled]}
          onPress={saveNote}
          disabled={saving}
        >
          <Text style={styles.buttonPrimaryText}>
            {saving ? 'Saving...' : 'Save Note'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2c3e50',
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  editor: {
    flex: 1,
    fontSize: 16,
    color: '#34495e',
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 300,
  },
  toolbarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#3498db',
    marginLeft: 8,
  },
  buttonSecondary: {
    backgroundColor: '#f2f2f2',
    marginRight: 8,
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonSecondaryText: {
    color: '#7f8c8d',
    fontWeight: 'bold',
    fontSize: 16,
  },
});