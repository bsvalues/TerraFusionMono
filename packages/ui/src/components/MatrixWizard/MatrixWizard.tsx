import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stepper } from '../shared/Stepper';
import { MatrixForm } from './MatrixForm';
import { MatrixEditor } from './MatrixEditor';
import { MatrixPreview } from './MatrixPreview';

/**
 * Matrix Wizard Component
 * 
 * A step-by-step wizard for creating and editing cost matrices used in
 * property valuation calculations.
 */
export const MatrixWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [matrix, setMatrix] = useState({
    name: '',
    baseCost: 0,
    modifiers: [] as { description: string; factor: number }[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [savedMatrixId, setSavedMatrixId] = useState<string | null>(null);

  const steps = [
    { label: 'Basic Details', description: 'Enter matrix name and base cost' },
    { label: 'Cost Modifiers', description: 'Add cost adjustment factors' },
    { label: 'Review', description: 'Verify your cost matrix' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Save to API
      const response = await fetch('/api/valuation/matrices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matrix),
      });

      if (!response.ok) {
        throw new Error('Error saving cost matrix');
      }

      const data = await response.json();
      setSavedMatrixId(data.matrix.matrixId);
      setIsLoading(false);
      
      // Go to preview step
      setCurrentStep(steps.length - 1);
    } catch (error) {
      console.error('Error saving cost matrix:', error);
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <MatrixForm 
            matrix={matrix} 
            setMatrix={setMatrix} 
          />
        );
      case 1:
        return (
          <MatrixEditor 
            matrix={matrix} 
            setMatrix={setMatrix} 
          />
        );
      case 2:
        return (
          <MatrixPreview 
            matrix={matrix}
            matrixId={savedMatrixId}
          />
        );
      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    if (currentStep === 0) {
      return !matrix.name || matrix.baseCost <= 0;
    }
    return false;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Cost Matrix Wizard</CardTitle>
        <CardDescription>
          Create and manage cost matrices for property valuation calculations
        </CardDescription>
      </CardHeader>
      
      <Stepper 
        steps={steps} 
        currentStep={currentStep} 
        onStepClick={(step) => {
          // Only allow clicking on previous steps or current step
          if (step <= currentStep) {
            setCurrentStep(step);
          }
        }} 
      />
      
      <CardContent className="pt-6">
        {renderStepContent()}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        
        {currentStep < steps.length - 1 ? (
          currentStep === steps.length - 2 ? (
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || matrix.modifiers.length === 0}
            >
              {isLoading ? 'Saving...' : 'Save Matrix'}
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={isNextDisabled()}
            >
              Next
            </Button>
          )
        ) : (
          <Button onClick={() => {
            setCurrentStep(0);
            setMatrix({
              name: '',
              baseCost: 0,
              modifiers: []
            });
            setSavedMatrixId(null);
          }}>
            Create New Matrix
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default MatrixWizard;