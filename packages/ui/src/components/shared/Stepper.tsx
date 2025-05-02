import React from 'react';

interface StepperProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick }) => (
  <div className="flex w-full mb-6">
    {steps.map((label, idx) => (
      <div
        key={idx}
        className={`flex-1 text-center p-3 cursor-pointer border-b-2 ${
          idx === currentStep
            ? 'border-blue-600 font-semibold text-blue-600'
            : 'border-gray-300 text-gray-500'
        } ${onStepClick ? 'hover:text-blue-500' : ''} transition-colors`}
        onClick={() => onStepClick && onStepClick(idx)}
      >
        <div className="step-number mb-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-sm">
          {idx + 1}
        </div>
        <div className="step-label text-sm">{label}</div>
      </div>
    ))}
  </div>
);