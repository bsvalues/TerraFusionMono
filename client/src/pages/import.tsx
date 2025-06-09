import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
// Define ImportType enum locally since we can't access it from UI package
enum ImportType {
  PACS = 'pacs',
  SOIL = 'soil',
  SENSOR = 'sensor',
  WEATHER = 'weather',
  CUSTOM = 'custom'
}

// Mock ImportWizard component temporarily until we can properly set up the imports
const ImportWizard = ({
  importType,
  onComplete,
  onCancel
}: {
  importType: ImportType;
  onComplete: (result: any) => void;
  onCancel: () => void;
}) => {
  return (
    <div className="border p-6 rounded-md">
      <h3 className="text-xl font-medium mb-4">Import Wizard for {importType}</h3>
      <p className="text-muted-foreground mb-6">
        This is a placeholder for the ImportWizard component. In production, this would be a multi-step form for importing {importType} data.
      </p>
      <div className="flex gap-4">
        <button 
          onClick={() => onComplete({ files: [{ name: 'sample.csv' }] })}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Complete Import
        </button>
        <button 
          onClick={onCancel}
          className="px-4 py-2 border border-input bg-background rounded-md"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default function ImportPage() {
  const { toast } = useToast();
  const [importComplete, setImportComplete] = useState(false);
  const [importType, setImportType] = useState<ImportType>(ImportType.PACS);

  const handleImportComplete = (result: any) => {
    setImportComplete(true);
    toast({
      title: 'Import Complete',
      description: `Successfully imported ${result.files.length} file(s).`,
    });
  };

  const handleImportCancel = () => {
    toast({
      title: 'Import Cancelled',
      description: 'The import process was cancelled.',
      variant: 'destructive',
    });
  };

  const resetImport = () => {
    setImportComplete(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Data Import</h1>
      </div>
      
      <Tabs defaultValue="pacs" onValueChange={(value) => setImportType(value as ImportType)}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value={ImportType.PACS}>PACS</TabsTrigger>
          <TabsTrigger value={ImportType.SOIL}>Soil</TabsTrigger>
          <TabsTrigger value={ImportType.SENSOR}>Sensor</TabsTrigger>
          <TabsTrigger value={ImportType.WEATHER}>Weather</TabsTrigger>
          <TabsTrigger value={ImportType.CUSTOM}>Custom</TabsTrigger>
        </TabsList>
        
        <TabsContent value={ImportType.PACS}>
          <Card>
            <CardHeader>
              <CardTitle>PACS Data Import</CardTitle>
              <CardDescription>
                Import PACS (Picture Archiving and Communication System) data from CSV or Excel files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importComplete ? (
                <div className="text-center py-8">
                  <h3 className="text-xl font-medium text-green-600">Import Complete!</h3>
                  <p className="text-muted-foreground mt-2">
                    Your PACS data has been successfully imported.
                  </p>
                  <button
                    onClick={resetImport}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Import More Data
                  </button>
                </div>
              ) : (
                <ImportWizard
                  importType={ImportType.PACS}
                  onComplete={handleImportComplete}
                  onCancel={handleImportCancel}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value={ImportType.SOIL}>
          <Card>
            <CardHeader>
              <CardTitle>Soil Data Import</CardTitle>
              <CardDescription>
                Import soil analysis data from CSV or Excel files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importComplete ? (
                <div className="text-center py-8">
                  <h3 className="text-xl font-medium text-green-600">Import Complete!</h3>
                  <p className="text-muted-foreground mt-2">
                    Your soil data has been successfully imported.
                  </p>
                  <button
                    onClick={resetImport}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Import More Data
                  </button>
                </div>
              ) : (
                <ImportWizard
                  importType={ImportType.SOIL}
                  onComplete={handleImportComplete}
                  onCancel={handleImportCancel}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value={ImportType.SENSOR}>
          <Card>
            <CardHeader>
              <CardTitle>Sensor Data Import</CardTitle>
              <CardDescription>
                Import IoT sensor data from CSV or Excel files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importComplete ? (
                <div className="text-center py-8">
                  <h3 className="text-xl font-medium text-green-600">Import Complete!</h3>
                  <p className="text-muted-foreground mt-2">
                    Your sensor data has been successfully imported.
                  </p>
                  <button
                    onClick={resetImport}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Import More Data
                  </button>
                </div>
              ) : (
                <ImportWizard
                  importType={ImportType.SENSOR}
                  onComplete={handleImportComplete}
                  onCancel={handleImportCancel}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value={ImportType.WEATHER}>
          <Card>
            <CardHeader>
              <CardTitle>Weather Data Import</CardTitle>
              <CardDescription>
                Import weather station data from CSV or Excel files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importComplete ? (
                <div className="text-center py-8">
                  <h3 className="text-xl font-medium text-green-600">Import Complete!</h3>
                  <p className="text-muted-foreground mt-2">
                    Your weather data has been successfully imported.
                  </p>
                  <button
                    onClick={resetImport}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Import More Data
                  </button>
                </div>
              ) : (
                <ImportWizard
                  importType={ImportType.WEATHER}
                  onComplete={handleImportComplete}
                  onCancel={handleImportCancel}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value={ImportType.CUSTOM}>
          <Card>
            <CardHeader>
              <CardTitle>Custom Data Import</CardTitle>
              <CardDescription>
                Import custom data from CSV or Excel files with flexible column mapping.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importComplete ? (
                <div className="text-center py-8">
                  <h3 className="text-xl font-medium text-green-600">Import Complete!</h3>
                  <p className="text-muted-foreground mt-2">
                    Your custom data has been successfully imported.
                  </p>
                  <button
                    onClick={resetImport}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Import More Data
                  </button>
                </div>
              ) : (
                <ImportWizard
                  importType={ImportType.CUSTOM}
                  onComplete={handleImportComplete}
                  onCancel={handleImportCancel}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}