import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stepper } from '../shared/Stepper';
import { IncomeForm } from './IncomeForm';
import { IncomePreview } from './IncomePreview';
import { IncomeResults } from './IncomeResults';

/**
 * Income Wizard Component
 * 
 * A step-by-step wizard interface for calculating property valuation using the income approach.
 * Uses the capitalization rate method to determine property value based on income metrics.
 */
export const IncomeWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [incomeData, setIncomeData] = useState({
    propertyType: '',
    grossIncome: 0,
    vacancyRate: 0.05,
    operatingExpenses: 0,
    capRate: 0.06
  });
  const [isLoading, setIsLoading] = useState(false);
  const [savedScheduleId, setSavedScheduleId] = useState<string | null>(null);

  const steps = [
    { label: 'Income Details', description: 'Enter income data' },
    { label: 'Review', description: 'Verify your information' },
    { label: 'Results', description: 'View calculation results' }
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
      const response = await fetch('/api/valuation/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incomeData),
      });

      if (!response.ok) {
        throw new Error('Error saving income schedule');
      }

      const data = await response.json();
      setSavedScheduleId(data.schedule.scheduleId);
      handleNext();
    } catch (error) {
      console.error('Error saving income schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <IncomeForm 
          incomeData={incomeData} 
          setIncomeData={setIncomeData} 
        />;
      case 1:
        return <IncomePreview 
          incomeData={incomeData} 
        />;
      case 2:
        return <IncomeResults 
          incomeData={incomeData} 
          scheduleId={savedScheduleId}
        />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Income Approach Valuation</CardTitle>
        <CardDescription>
          Calculate property value using the income approach with capitalization rates
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
          currentStep === 1 ? (
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Submit'}
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={!incomeData.propertyType || incomeData.grossIncome <= 0}
            >
              Next
            </Button>
          )
        ) : (
          <Button onClick={() => {
            setCurrentStep(0);
            setIncomeData({
              propertyType: '',
              grossIncome: 0,
              vacancyRate: 0.05,
              operatingExpenses: 0,
              capRate: 0.06
            });
            setSavedScheduleId(null);
          }}>
            Create New
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default IncomeWizard;