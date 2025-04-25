import React, { useState } from 'react';
import { CollaborationProvider } from '@/components/collaboration/CollaborationProvider';
import CollaborativeFieldEditor from '@/components/field-data/CollaborativeFieldEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, List, Grid2X2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock field data for demonstration
const mockFields = [
  {
    id: 'field-001',
    name: 'North Field',
    cropType: 'Corn',
    area: '45 acres',
    lastVisited: '2025-04-20',
    observations: 'The north section is showing signs of nitrogen deficiency. Soil moisture is adequate but some pest pressure observed on the eastern edge.',
    soilType: 'loamy',
    cropHealth: 'good',
    soilMoisture: 'moderate',
    pestPresence: 'low',
    weedCoverage: 'minimal'
  },
  {
    id: 'field-002',
    name: 'Southwest Pasture',
    cropType: 'Soybean',
    area: '32 acres',
    lastVisited: '2025-04-18',
    soilType: 'clay',
    cropHealth: 'average',
    soilMoisture: 'moist',
    pestPresence: 'moderate',
    weedCoverage: 'low'
  },
  {
    id: 'field-003',
    name: 'East Hillside',
    cropType: 'Wheat',
    area: '28 acres',
    lastVisited: '2025-04-15',
    soilType: 'sandy',
    cropHealth: 'excellent',
    soilMoisture: 'dry',
    pestPresence: 'none',
    weedCoverage: 'low'
  }
];

const FieldDataPage: React.FC = () => {
  // State for the active field
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [cropFilter, setCropFilter] = useState<string>('');
  
  // Get the active field data
  const activeField = mockFields.find(field => field.id === activeFieldId);
  
  // Filter fields based on search and crop filter
  const filteredFields = mockFields.filter(field => {
    const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCrop = !cropFilter || field.cropType === cropFilter;
    return matchesSearch && matchesCrop;
  });
  
  // Handle selecting a field
  const handleSelectField = (fieldId: string) => {
    setActiveFieldId(fieldId);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Field Data Collection</h1>
          <p className="text-gray-500">Collaboratively collect and manage field data</p>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Field
        </Button>
      </div>
      
      {activeFieldId ? (
        <div className="grid grid-cols-1 gap-6">
          <Button 
            variant="outline" 
            className="w-fit"
            onClick={() => setActiveFieldId(null)}
          >
            Back to Fields
          </Button>
          
          <CollaborationProvider>
            <CollaborativeFieldEditor
              fieldId={activeFieldId}
              fieldName={activeField?.name || ''}
              initialData={activeField}
            />
          </CollaborationProvider>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex-1 max-w-sm">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <Input
                id="search"
                placeholder="Search fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 items-center">
              <div className="w-40">
                <Select value={cropFilter} onValueChange={setCropFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by crop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All crops</SelectItem>
                    <SelectItem value="Corn">Corn</SelectItem>
                    <SelectItem value="Soybean">Soybean</SelectItem>
                    <SelectItem value="Wheat">Wheat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid2X2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredFields.map(field => (
              <Card 
                key={field.id} 
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelectField(field.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle>{field.name}</CardTitle>
                  <CardDescription>{field.cropType} - {field.area}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <span className="text-gray-500">Crop Health:</span>
                      <span className="capitalize">{field.cropHealth}</span>
                      
                      <span className="text-gray-500">Soil Type:</span>
                      <span className="capitalize">{field.soilType}</span>
                      
                      <span className="text-gray-500">Last Visit:</span>
                      <span>{new Date(field.lastVisited).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 border-t">
                  <Button variant="ghost" size="sm" className="w-full">
                    Open Field Data
                  </Button>
                </CardFooter>
              </Card>
            ))}
            
            {filteredFields.length === 0 && (
              <div className="col-span-full flex items-center justify-center p-8 border rounded-lg bg-gray-50">
                <p className="text-gray-500">No fields found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldDataPage;