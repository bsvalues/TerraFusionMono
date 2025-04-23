import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ChevronLeft, ChevronRight, Code, FileJson, Package, Play, Upload } from "lucide-react";
import PluginManifestStep from './steps/PluginManifestStep';
import PluginCodeStep from './steps/PluginCodeStep';
import PluginTestStep from './steps/PluginTestStep';
import PluginPublishStep from './steps/PluginPublishStep';
import PluginCompletionStep from './steps/PluginCompletionStep';

const steps = [
  { id: 'manifest', title: 'Create Manifest', icon: FileJson },
  { id: 'code', title: 'Write Plugin Code', icon: Code },
  { id: 'test', title: 'Test Your Plugin', icon: Play },
  { id: 'publish', title: 'Publish Plugin', icon: Upload },
  { id: 'completion', title: 'Complete', icon: Check }
];

interface OnboardingProgress {
  currentStep: string;
  completedSteps: string[];
  pluginData: {
    name: string;
    version: string;
    description: string;
    entryPoint: string;
    code: string;
    hasQuotas: boolean;
    cpuMs: number;
    memKb: number;
  };
}

export default function OnboardingWizard() {
  const [progress, setProgress] = useState<OnboardingProgress>({
    currentStep: 'manifest',
    completedSteps: [],
    pluginData: {
      name: 'my-first-plugin',
      version: '1.0.0',
      description: 'My first TerraFusion plugin',
      entryPoint: 'index.js',
      code: 'module.exports = {\n  analyze: function(data) {\n    // Your plugin code here\n    return { result: "Hello from plugin!" };\n  }\n};\n',
      hasQuotas: true,
      cpuMs: 1000,
      memKb: 10240
    }
  });

  const activeStepIndex = steps.findIndex(step => step.id === progress.currentStep);
  
  const goToStep = (stepId: string) => {
    // Only allow navigating to completed steps or the next available step
    if (progress.completedSteps.includes(stepId) || steps[activeStepIndex + 1]?.id === stepId) {
      setProgress(prev => ({ ...prev, currentStep: stepId }));
    }
  };

  const completeStep = () => {
    const currentStepId = progress.currentStep;
    
    // Add current step to completed steps if not already there
    if (!progress.completedSteps.includes(currentStepId)) {
      setProgress(prev => ({
        ...prev,
        completedSteps: [...prev.completedSteps, currentStepId]
      }));
    }
    
    // Move to next step if available
    const nextStepIndex = activeStepIndex + 1;
    if (nextStepIndex < steps.length) {
      const nextStepId = steps[nextStepIndex].id;
      setProgress(prev => ({ ...prev, currentStep: nextStepId }));
    }
  };

  const updatePluginData = (updates: Partial<OnboardingProgress['pluginData']>) => {
    setProgress(prev => ({
      ...prev,
      pluginData: { ...prev.pluginData, ...updates }
    }));
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Plugin Integration Tutorial</CardTitle>
          <CardDescription>
            Learn how to create and integrate plugins with TerraFusion
          </CardDescription>
        </CardHeader>
        
        <div className="px-6">
          <div className="flex items-center justify-between mb-6 border-b">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = progress.currentStep === step.id;
              const isCompleted = progress.completedSteps.includes(step.id);
              const isAccessible = isCompleted || isActive;
              
              return (
                <div 
                  key={step.id}
                  className={`flex flex-col items-center pb-4 cursor-pointer relative ${
                    isAccessible ? 'text-primary hover:text-primary/80' : 'text-muted-foreground'
                  } ${isActive ? 'border-b-2 border-primary -mb-px' : ''}`}
                  onClick={() => isAccessible && goToStep(step.id)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    isActive ? 'bg-primary text-primary-foreground' : 
                    isCompleted ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                  </div>
                  <span className="text-xs font-medium">{step.title}</span>
                  
                  {/* Line connector between steps */}
                  {index < steps.length - 1 && (
                    <div className="absolute h-px w-full bg-muted top-5 left-[105%] transform -translate-x-1/2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <CardContent>
          {progress.currentStep === 'manifest' && (
            <PluginManifestStep 
              pluginData={progress.pluginData} 
              updatePluginData={updatePluginData} 
            />
          )}
          
          {progress.currentStep === 'code' && (
            <PluginCodeStep 
              pluginData={progress.pluginData} 
              updatePluginData={updatePluginData} 
            />
          )}
          
          {progress.currentStep === 'test' && (
            <PluginTestStep 
              pluginData={progress.pluginData} 
            />
          )}
          
          {progress.currentStep === 'publish' && (
            <PluginPublishStep 
              pluginData={progress.pluginData} 
            />
          )}
          
          {progress.currentStep === 'completion' && (
            <PluginCompletionStep 
              pluginData={progress.pluginData} 
            />
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              const prevStepIndex = activeStepIndex - 1;
              if (prevStepIndex >= 0) {
                goToStep(steps[prevStepIndex].id);
              }
            }}
            disabled={activeStepIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          
          <Button
            onClick={completeStep}
            disabled={activeStepIndex === steps.length - 1}
          >
            {activeStepIndex === steps.length - 1 ? 'Finish' : 'Next'} <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}