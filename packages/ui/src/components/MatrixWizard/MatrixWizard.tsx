import React, { useState } from 'react';
import { Stepper } from '../shared/Stepper';
import { CostMatrix } from '../../schemas/wizardSchemas';
import { MatrixEditor } from './MatrixEditor';
import { PreviewChart } from '../shared/PreviewChart';
import { Check, ChevronLeft, ChevronRight, Save } from 'lucide-react';

const steps = ['Define Matrix', 'Edit Grid', 'Preview', 'Save'];

interface MatrixWizardProps {
  onSave?: (matrix: CostMatrix) => void;
  onCancel?: () => void;
  initialMatrix?: CostMatrix;
  className?: string;
}

export const MatrixWizard: React.FC<MatrixWizardProps> = ({ 
  onSave, 
  onCancel,
  initialMatrix,
  className = '' 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [matrix, setMatrix] = useState<CostMatrix>(initialMatrix || { 
    name: '', 
    baseCost: 0, 
    modifiers: [] 
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
    // Notify parent component with the completed matrix
    if (onSave) {
      onSave(matrix);
    }
    setSaved(true);
  };

  // Validation for next button
  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return matrix.name.trim() !== '' && matrix.baseCost > 0;
      case 1:
        return matrix.modifiers.length > 0 && 
               matrix.modifiers.every(m => m.description.trim() !== '');
      case 2:
        return sampleParcelId.trim() !== '';
      default:
        return true;
    }
  };

  return (
    <div className={`max-w-full bg-white p-4 md:p-6 rounded-lg shadow-md ${className}`}>
      <h2 className="text-xl font-bold mb-4">Cost Matrix Wizard</h2>
      
      <Stepper steps={steps} currentStep={currentStep} onStepClick={handleStepChange} />
      
      <div className="wizard-content min-h-[300px] mb-6">
        {currentStep === 0 && (
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Define Matrix Basics</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Matrix Name
              </label>
              <input
                type="text"
                value={matrix.name}
                onChange={(e) => setMatrix({ ...matrix, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter a descriptive name for this cost matrix"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Cost ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={matrix.baseCost}
                onChange={(e) => setMatrix({ ...matrix, baseCost: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter the base cost for this matrix"
              />
            </div>
          </div>
        )}
        
        {currentStep === 1 && (
          <MatrixEditor matrix={matrix} onChange={setMatrix} />
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
            
            <PreviewChart parcelId={sampleParcelId} matrix={matrix} className="mt-4" />
          </div>
        )}
        
        {currentStep === 3 && (
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Save Cost Matrix</h3>
            
            <div className="mb-6">
              <div className="font-medium mb-2">Matrix Summary</div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-gray-600">Name:</dt>
                <dd>{matrix.name}</dd>
                
                <dt className="text-gray-600">Base Cost:</dt>
                <dd>${matrix.baseCost.toLocaleString()}</dd>
                
                <dt className="text-gray-600">Modifiers:</dt>
                <dd>{matrix.modifiers.length}</dd>
              </dl>
            </div>
            
            {saved ? (
              <div className="text-center p-4 text-green-600">
                <Check size={48} className="mx-auto mb-2" />
                <p className="font-medium">Matrix saved successfully!</p>
              </div>
            ) : (
              <button
                onClick={handleSave}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-md font-medium flex items-center justify-center"
              >
                <Save size={18} className="mr-2" />
                Save Cost Matrix
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