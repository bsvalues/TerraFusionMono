import React from 'react';
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface StepperProps {
  steps: {
    label: string;
    description: string;
  }[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick
}) => {
  return (
    <div className="px-6">
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "flex flex-col items-center relative",
              {
                "cursor-pointer": onStepClick && index <= currentStep
              }
            )}
            onClick={() => onStepClick && onStepClick(index)}
          >
            {/* Step number/icon */}
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 border-gray-300 z-10",
                {
                  "bg-primary border-primary text-primary-foreground": index <= currentStep,
                  "bg-background text-muted-foreground": index > currentStep
                }
              )}
            >
              {index < currentStep ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>

            {/* Step label */}
            <div className="mt-2 text-center">
              <div className={cn(
                "text-sm font-medium",
                {
                  "text-primary": index <= currentStep,
                  "text-muted-foreground": index > currentStep
                }
              )}>
                {step.label}
              </div>
              <div className="text-xs text-muted-foreground max-w-[120px] truncate">
                {step.description}
              </div>
            </div>

            {/* Connection line */}
            {index < steps.length - 1 && (
              <div className={cn(
                "absolute w-full h-[2px] top-5 left-1/2",
                {
                  "bg-primary": index < currentStep,
                  "bg-gray-200": index >= currentStep
                }
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stepper;