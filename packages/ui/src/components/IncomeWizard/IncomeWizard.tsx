import React, { useState } from 'react';
import { Stepper } from '../shared/Stepper';
import { IncomeSchedule } from '../../schemas/wizardSchemas';
import { IncomeEditor } from './IncomeEditor';
import { PreviewChart } from '../shared/PreviewChart';
import { Check, ChevronLeft, ChevronRight, Save } from 'lucide-react';

const steps = ['Define Schedule', 'Edit Details', 'Preview', 'Save'];

interface IncomeWizardProps {
  onSave?: (schedule: IncomeSchedule) => void;
  onCancel?: () => void;
  initialSchedule?: IncomeSchedule;
  className?: string;
}

export const IncomeWizard: React.FC<IncomeWizardProps> = ({ 
  onSave, 
  onCancel,
  initialSchedule,
  className = '' 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [schedule, setSchedule] = useState<IncomeSchedule>(initialSchedule || { 
    propertyType: '', 
    grossIncome: 0, 
    vacancyRate: 0.05, 
    operatingExpenses: 0, 
    capRate: 0.06 
  });
  const [sampleParcelId, setSampleParcelId] = useState<string>('');
  const [saved, setSaved] = useState(false);

  const handleStepChange = (step: number) => {
    // Only allow jumping to completed steps or next step
    if (step <= currentStep + 1) {
      setCurrentStep(step);
    }
  };

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

  const handleSave = () => {
    // Notify parent component with the completed schedule
    if (onSave) {
      onSave(schedule);
    }
    setSaved(true);
  };

  // Validation for next button
  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return schedule.propertyType.trim() !== '';
      case 1:
        return schedule.grossIncome > 0 && schedule.capRate > 0;
      case 2:
        return sampleParcelId.trim() !== '';
      default:
        return true;
    }
  };

  return (
    <div className={`max-w-full bg-white p-4 md:p-6 rounded-lg shadow-md ${className}`}>
      <h2 className="text-xl font-bold mb-4">Income Schedule Wizard</h2>
      
      <Stepper steps={steps} currentStep={currentStep} onStepClick={handleStepChange} />
      
      <div className="wizard-content min-h-[300px] mb-6">
        {currentStep === 0 && (
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Define Income Schedule</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type
              </label>
              <select
                value={schedule.propertyType}
                onChange={(e) => setSchedule({ ...schedule, propertyType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select property type</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Agricultural">Agricultural</option>
                <option value="Mixed-Use">Mixed-Use</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gross Annual Income ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={schedule.grossIncome}
                onChange={(e) => setSchedule({ ...schedule, grossIncome: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter gross annual income"
              />
            </div>
          </div>
        )}
        
        {currentStep === 1 && (
          <IncomeEditor schedule={schedule} onChange={setSchedule} />
        )}
        
        {currentStep === 2 && (
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Preview Valuation</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample Parcel ID
              </label>
              <input
                type="text"
                value={sampleParcelId}
                onChange={(e) => setSampleParcelId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter a parcel ID to preview valuation"
              />
            </div>
            
            <PreviewChart parcelId={sampleParcelId} income={schedule} className="mt-4" />
          </div>
        )}
        
        {currentStep === 3 && (
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Save Income Schedule</h3>
            
            <div className="mb-6">
              <div className="font-medium mb-2">Schedule Summary</div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-gray-600">Property Type:</dt>
                <dd>{schedule.propertyType}</dd>
                
                <dt className="text-gray-600">Gross Income:</dt>
                <dd>${schedule.grossIncome.toLocaleString()}</dd>
                
                <dt className="text-gray-600">Vacancy Rate:</dt>
                <dd>{(schedule.vacancyRate * 100).toFixed(1)}%</dd>
                
                <dt className="text-gray-600">Operating Expenses:</dt>
                <dd>${schedule.operatingExpenses.toLocaleString()}</dd>
                
                <dt className="text-gray-600">Cap Rate:</dt>
                <dd>{(schedule.capRate * 100).toFixed(2)}%</dd>
                
                <dt className="text-gray-600">Estimated Value:</dt>
                <dd className="font-semibold text-blue-600">
                  ${schedule.capRate > 0 
                      ? Math.round((schedule.grossIncome * (1 - schedule.vacancyRate) - schedule.operatingExpenses) / schedule.capRate).toLocaleString() 
                      : 'N/A'}
                </dd>
              </dl>
            </div>
            
            {saved ? (
              <div className="text-center p-4 text-green-600">
                <Check size={48} className="mx-auto mb-2" />
                <p className="font-medium">Income schedule saved successfully!</p>
              </div>
            ) : (
              <button
                onClick={handleSave}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-md font-medium flex items-center justify-center"
              >
                <Save size={18} className="mr-2" />
                Save Income Schedule
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="flex justify-between mt-6">
        {currentStep > 0 ? (
          <button 
            onClick={handleBack}
            className="px-4 py-2 border border-gray-300 rounded-md flex items-center text-gray-700"
          >
            <ChevronLeft size={16} className="mr-1" /> Back
          </button>
        ) : (
          <button 
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
          >
            Cancel
          </button>
        )}
        
        {currentStep < steps.length - 1 && (
          <button 
            onClick={handleNext}
            disabled={!canProceed()}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md flex items-center ${!canProceed() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Next <ChevronRight size={16} className="ml-1" />
          </button>
        )}
      </div>
    </div>
  );
};