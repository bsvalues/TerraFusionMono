import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Stepper } from './Stepper';
import { FileUpload } from './FileUpload';
import { ColumnMapper } from './ColumnMapper';
import { ValidationReport } from './ValidationReport';
import { 
  ImportFile, 
  ImportType, 
  ImportWizardProps, 
  ImportWizardState, 
  MappingConfig, 
  ValidationResult 
} from './types';

const STEPS = [
  { id: 'upload', name: 'Upload Files' },
  { id: 'map', name: 'Map Columns' },
  { id: 'validate', name: 'Validate' },
  { id: 'import', name: 'Import' }
];

// Default required columns by import type
const REQUIRED_COLUMNS: Record<ImportType, Record<string, { name: string; dataType: string; required: boolean }>> = {
  [ImportType.PACS]: {
    patient_id: { name: 'Patient ID', dataType: 'string', required: true },
    study_date: { name: 'Study Date', dataType: 'date', required: true },
    modality: { name: 'Modality', dataType: 'string', required: true },
    description: { name: 'Description', dataType: 'string', required: false },
    referring_physician: { name: 'Referring Physician', dataType: 'string', required: false }
  },
  [ImportType.SOIL]: {
    location_id: { name: 'Location ID', dataType: 'string', required: true },
    sample_date: { name: 'Sample Date', dataType: 'date', required: true },
    ph: { name: 'pH', dataType: 'number', required: true },
    organic_matter: { name: 'Organic Matter %', dataType: 'number', required: false },
    nitrogen: { name: 'Nitrogen (ppm)', dataType: 'number', required: true },
    phosphorus: { name: 'Phosphorus (ppm)', dataType: 'number', required: true },
    potassium: { name: 'Potassium (ppm)', dataType: 'number', required: true }
  },
  [ImportType.SENSOR]: {
    device_id: { name: 'Device ID', dataType: 'string', required: true },
    timestamp: { name: 'Timestamp', dataType: 'datetime', required: true },
    reading_type: { name: 'Reading Type', dataType: 'string', required: true },
    value: { name: 'Value', dataType: 'number', required: true },
    units: { name: 'Units', dataType: 'string', required: false },
    latitude: { name: 'Latitude', dataType: 'number', required: false },
    longitude: { name: 'Longitude', dataType: 'number', required: false }
  },
  [ImportType.WEATHER]: {
    station_id: { name: 'Station ID', dataType: 'string', required: true },
    date: { name: 'Date', dataType: 'date', required: true },
    temperature_min: { name: 'Min Temperature', dataType: 'number', required: true },
    temperature_max: { name: 'Max Temperature', dataType: 'number', required: true },
    precipitation: { name: 'Precipitation', dataType: 'number', required: true },
    wind_speed: { name: 'Wind Speed', dataType: 'number', required: false },
    humidity: { name: 'Humidity %', dataType: 'number', required: false }
  },
  [ImportType.CUSTOM]: {
    id: { name: 'ID', dataType: 'string', required: true },
    name: { name: 'Name', dataType: 'string', required: true },
    value: { name: 'Value', dataType: 'string', required: true }
  }
};

export function ImportWizard({ 
  onComplete, 
  onCancel, 
  importType = ImportType.SOIL, 
  initialData 
}: ImportWizardProps) {
  const [state, setState] = useState<ImportWizardState>({
    activeStep: 0,
    importType,
    files: [],
    mapping: null,
    validationResult: null,
    importInProgress: false,
    importComplete: false,
    ...(initialData || {})
  });

  // Handle file selection
  const handleFilesAccepted = (files: ImportFile[]) => {
    setState(prev => ({ ...prev, files }));
  };

  // Handle mapping completion
  const handleMappingComplete = (mapping: MappingConfig) => {
    setState(prev => ({ ...prev, mapping, activeStep: 2 }));
  };

  // Handle validation completion
  const handleValidationComplete = (validationResult: ValidationResult) => {
    setState(prev => ({ ...prev, validationResult }));
  };

  // Handle step navigation
  const goToStep = (step: number) => {
    if (step >= 0 && step <= 3) {
      setState(prev => ({ ...prev, activeStep: step }));
    }
  };

  // Handle navigation to next step
  const nextStep = () => {
    goToStep(state.activeStep + 1);
  };

  // Handle navigation to previous step
  const prevStep = () => {
    goToStep(state.activeStep - 1);
  };

  // Handle import completion
  const completeImport = () => {
    setState(prev => ({ ...prev, importInProgress: true }));
    
    // Simulate import process
    setTimeout(() => {
      setState(prev => ({ ...prev, importInProgress: false, importComplete: true }));
      onComplete({
        importType: state.importType,
        files: state.files,
        mapping: state.mapping,
        validationResult: state.validationResult
      });
    }, 2000);
  };

  // Determine if we can proceed to the next step
  const canProceed = () => {
    switch (state.activeStep) {
      case 0: // Upload step
        return state.files.length > 0;
      case 1: // Mapping step
        return state.mapping !== null;
      case 2: // Validation step
        return state.validationResult !== null;
      default:
        return false;
    }
  };

  // Render the current step content
  const renderStepContent = () => {
    switch (state.activeStep) {
      case 0: // Upload step
        return (
          <FileUpload
            importType={state.importType}
            onFilesAccepted={handleFilesAccepted}
            acceptedFileTypes={['.csv', '.xlsx', '.xls']}
          />
        );
      case 1: // Mapping step
        return (
          <ColumnMapper
            files={state.files}
            requiredTargetColumns={REQUIRED_COLUMNS[state.importType]}
            onMappingComplete={handleMappingComplete}
            initialMapping={state.mapping || undefined}
          />
        );
      case 2: // Validation step
        return state.mapping ? (
          <ValidationReport
            importType={state.importType}
            files={state.files}
            mapping={state.mapping}
            onValidationComplete={handleValidationComplete}
            onBack={prevStep}
          />
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No mapping configuration available. Please go back and map your columns.</p>
            <Button onClick={prevStep} variant="outline" className="mt-4">
              Back to Mapping
            </Button>
          </div>
        );
      case 3: // Import step
        return (
          <div className="p-8 text-center space-y-4">
            {state.importComplete ? (
              <>
                <h3 className="text-xl font-medium text-green-600">Import Complete!</h3>
                <p className="text-muted-foreground">
                  Your data has been successfully imported.
                </p>
                <Button onClick={() => onComplete(state)} className="mt-4">
                  Close
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-medium">Ready to Import</h3>
                <p className="text-muted-foreground">
                  Your data is ready to be imported. Click the button below to proceed.
                </p>
                <Button 
                  onClick={completeImport} 
                  disabled={state.importInProgress}
                  className="mt-4"
                >
                  {state.importInProgress ? "Importing..." : "Start Import"}
                </Button>
              </>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // Determine actions for the current step
  const renderActions = () => {
    if (state.activeStep === 0) {
      return (
        <div className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={nextStep} disabled={!canProceed()}>
            Next
          </Button>
        </div>
      );
    }
    
    if (state.activeStep === 1) {
      return (
        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep}>
            Back
          </Button>
          {/* Next button is handled within the ColumnMapper component */}
        </div>
      );
    }
    
    // No actions for steps 2 and 3 as they have their own internal actions
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted rounded-lg p-4">
        <Stepper steps={STEPS} currentStep={state.activeStep} />
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {renderStepContent()}
        </CardContent>
      </Card>
      
      {renderActions()}
    </div>
  );
}