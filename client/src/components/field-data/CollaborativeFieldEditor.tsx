import React, { useEffect, useRef, useState } from 'react';
import { useCollaboration } from '../collaboration/CollaborationProvider';
import * as Y from 'yjs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Edit3, Users, Map, Save, AlertTriangle, Upload, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface CollaborativeFieldEditorProps {
  fieldId: string;
  fieldName: string;
  initialData?: any;
  readOnly?: boolean;
}

const CollaborativeFieldEditor: React.FC<CollaborativeFieldEditorProps> = ({
  fieldId,
  fieldName,
  initialData = {},
  readOnly = false
}) => {
  // Get the collaboration context
  const {
    ydoc,
    status,
    connect,
    disconnect,
    sendUpdate,
    participants
  } = useCollaboration();

  // Local state for field data
  const [observations, setObservations] = useState('');
  const [soilType, setSoilType] = useState('');
  const [cropHealth, setCropHealth] = useState('');
  const [soilMoisture, setSoilMoisture] = useState('');
  const [pestPresence, setPestPresence] = useState('');
  const [weedCoverage, setWeedCoverage] = useState('');
  const [currentTab, setCurrentTab] = useState('general');
  const [localChanges, setLocalChanges] = useState(false);
  const [sessionId, setSessionId] = useState('');

  // Toast notifications
  const { toast } = useToast();
  
  // References to Y.js shared types
  const observationsRef = useRef<Y.Text | null>(null);
  const metadataRef = useRef<Y.Map<any> | null>(null);
  
  // Effect to handle connecting to the collaboration session
  useEffect(() => {
    // Generate a session ID based on the field ID
    const fieldSessionId = `field-${fieldId}`;
    setSessionId(fieldSessionId);
    
    // If not already connected, connect to the session
    if (status === 'disconnected') {
      // In a real app, you'd get a proper token from your auth system
      connect(fieldSessionId, 'demo-token');
    }
    
    // Clean up on unmount
    return () => {
      disconnect();
    };
  }, [fieldId]);
  
  // Effect to initialize Y.js shared types when the document is available
  useEffect(() => {
    if (ydoc) {
      // Get or create the shared text for observations
      observationsRef.current = ydoc.getText('observations');
      
      // Get or create the shared map for metadata
      metadataRef.current = ydoc.getMap('metadata');
      
      // Initialize with default values if empty
      if (observationsRef.current.length === 0 && initialData.observations) {
        observationsRef.current.insert(0, initialData.observations);
      }
      
      if (metadataRef.current.size === 0) {
        if (initialData.soilType) metadataRef.current.set('soilType', initialData.soilType);
        if (initialData.cropHealth) metadataRef.current.set('cropHealth', initialData.cropHealth);
        if (initialData.soilMoisture) metadataRef.current.set('soilMoisture', initialData.soilMoisture);
        if (initialData.pestPresence) metadataRef.current.set('pestPresence', initialData.pestPresence);
        if (initialData.weedCoverage) metadataRef.current.set('weedCoverage', initialData.weedCoverage);
      }
      
      // Initial state
      setObservations(observationsRef.current.toString());
      setSoilType(metadataRef.current.get('soilType') || '');
      setCropHealth(metadataRef.current.get('cropHealth') || '');
      setSoilMoisture(metadataRef.current.get('soilMoisture') || '');
      setPestPresence(metadataRef.current.get('pestPresence') || '');
      setWeedCoverage(metadataRef.current.get('weedCoverage') || '');
      
      // Register observers for changes
      observationsRef.current.observe(event => {
        setObservations(observationsRef.current!.toString());
      });
      
      metadataRef.current.observe(event => {
        // Get updated values
        setSoilType(metadataRef.current!.get('soilType') || '');
        setCropHealth(metadataRef.current!.get('cropHealth') || '');
        setSoilMoisture(metadataRef.current!.get('soilMoisture') || '');
        setPestPresence(metadataRef.current!.get('pestPresence') || '');
        setWeedCoverage(metadataRef.current!.get('weedCoverage') || '');
      });
      
      // Listen for document updates
      ydoc.on('update', (update: Uint8Array, origin: any) => {
        // If the update didn't come from this client, send it to the server
        if (origin !== 'local') {
          setLocalChanges(true);
        }
      });
    }
  }, [ydoc]);
  
  // Handler for observation text changes
  const handleObservationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (readOnly || !observationsRef.current) return;
    
    const newValue = e.target.value;
    const currentValue = observationsRef.current.toString();
    
    // Only update if the value has changed
    if (newValue !== currentValue) {
      // Delete the entire content and insert the new value
      observationsRef.current.delete(0, observationsRef.current.length);
      observationsRef.current.insert(0, newValue);
      setLocalChanges(true);
    }
  };
  
  // Handler for metadata changes
  const handleMetadataChange = (key: string, value: string) => {
    if (readOnly || !metadataRef.current) return;
    
    // Set the new value
    metadataRef.current.set(key, value);
    setLocalChanges(true);
    
    // Update local state
    switch (key) {
      case 'soilType':
        setSoilType(value);
        break;
      case 'cropHealth':
        setCropHealth(value);
        break;
      case 'soilMoisture':
        setSoilMoisture(value);
        break;
      case 'pestPresence':
        setPestPresence(value);
        break;
      case 'weedCoverage':
        setWeedCoverage(value);
        break;
    }
  };
  
  // Handler for saving changes
  const handleSave = async () => {
    try {
      // In a real app, you'd save to your backend here
      console.log('Saving field data:', {
        observations,
        soilType,
        cropHealth,
        soilMoisture,
        pestPresence,
        weedCoverage
      });
      
      // Mark as saved
      setLocalChanges(false);
      
      toast({
        title: 'Saved',
        description: 'Field data saved successfully',
      });
    } catch (error) {
      console.error('Error saving field data:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to save field data',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Edit3 className="h-5 w-5 mr-2" /> 
              Field Data: {fieldName}
            </CardTitle>
            <CardDescription>
              Collaborative field data collection and annotation
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            {localChanges && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Unsaved changes
              </Badge>
            )}
            
            <Badge variant="outline" className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {participants.length} active
            </Badge>
            
            {status === 'connected' ? (
              <Badge variant="outline" className="bg-green-50 text-green-700">Connected</Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700">Disconnected</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-hidden">
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="soil">Soil & Crop</TabsTrigger>
            <TabsTrigger value="pests">Pests & Weeds</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="h-full flex flex-col space-y-4">
            <div className="space-y-2">
              <Label htmlFor="observations">Observations & Notes</Label>
              <Textarea
                id="observations"
                value={observations}
                onChange={handleObservationChange}
                placeholder="Enter field observations, issues, and action items..."
                className="min-h-[200px] flex-grow"
                disabled={readOnly}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="soil" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="soilType">Soil Type</Label>
                <Select
                  value={soilType}
                  onValueChange={(value) => handleMetadataChange('soilType', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger id="soilType">
                    <SelectValue placeholder="Select soil type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clay">Clay</SelectItem>
                    <SelectItem value="sandy">Sandy</SelectItem>
                    <SelectItem value="loamy">Loamy</SelectItem>
                    <SelectItem value="silty">Silty</SelectItem>
                    <SelectItem value="peaty">Peaty</SelectItem>
                    <SelectItem value="chalky">Chalky</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cropHealth">Crop Health</Label>
                <Select
                  value={cropHealth}
                  onValueChange={(value) => handleMetadataChange('cropHealth', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger id="cropHealth">
                    <SelectValue placeholder="Select crop health" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="soilMoisture">Soil Moisture</Label>
                <Select
                  value={soilMoisture}
                  onValueChange={(value) => handleMetadataChange('soilMoisture', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger id="soilMoisture">
                    <SelectValue placeholder="Select soil moisture" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very-dry">Very Dry</SelectItem>
                    <SelectItem value="dry">Dry</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="moist">Moist</SelectItem>
                    <SelectItem value="wet">Wet</SelectItem>
                    <SelectItem value="saturated">Saturated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="pests" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pestPresence">Pest Presence</Label>
                <Select
                  value={pestPresence}
                  onValueChange={(value) => handleMetadataChange('pestPresence', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger id="pestPresence">
                    <SelectValue placeholder="Select pest presence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weedCoverage">Weed Coverage</Label>
                <Select
                  value={weedCoverage}
                  onValueChange={(value) => handleMetadataChange('weedCoverage', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger id="weedCoverage">
                    <SelectValue placeholder="Select weed coverage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (0%)</SelectItem>
                    <SelectItem value="minimal">Minimal (1-10%)</SelectItem>
                    <SelectItem value="low">Low (11-25%)</SelectItem>
                    <SelectItem value="moderate">Moderate (26-50%)</SelectItem>
                    <SelectItem value="high">High (51-75%)</SelectItem>
                    <SelectItem value="severe">Severe (76-100%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="flex space-x-2">
          <Button variant="outline" disabled={readOnly}>
            <Map className="h-4 w-4 mr-2" />
            View Map
          </Button>
          <Button variant="outline" disabled={readOnly}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Photos
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="destructive" disabled={readOnly}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={readOnly || !localChanges || status !== 'connected'}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CollaborativeFieldEditor;