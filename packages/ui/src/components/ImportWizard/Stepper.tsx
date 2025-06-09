import React from 'react';
import { cn } from '@/lib/utils';
import { Check, CircleDashed } from 'lucide-react';

type Step = {
  id: string;
  name: string;
  description?: string;
};

type StepperProps = {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
};

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  return (
    <nav aria-label="Progress" className={cn("w-full", className)}>
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step, index) => (
          <li key={step.id} className="md:flex-1">
            <div
              className={cn(
                "group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4",
                index < currentStep
                  ? "border-primary"
                  : index === currentStep
                  ? "border-primary"
                  : "border-muted-foreground/30"
              )}
            >
              <button
                onClick={() => onStepClick && onStepClick(index)}
                className={cn(
                  "flex items-center text-sm font-medium",
                  index < currentStep
                    ? "text-primary"
                    : index === currentStep
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
                disabled={!onStepClick}
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full mr-3">
                  {index < currentStep ? (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  ) : index === currentStep ? (
                    <CircleDashed className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  )}
                </span>
                <span>{step.name}</span>
              </button>
              {step.description && (
                <span className="text-sm text-muted-foreground ml-11">
                  {step.description}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}