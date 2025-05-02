import React from 'react';
import { CostMatrix } from '../../schemas/wizardSchemas';
import { Button } from '@radix-ui/react-dropdown-menu';
import { Plus, Trash2 } from 'lucide-react';

interface MatrixEditorProps {
  matrix: CostMatrix;
  onChange: (matrix: CostMatrix) => void;
  className?: string;
}

export const MatrixEditor: React.FC<MatrixEditorProps> = ({ 
  matrix, 
  onChange, 
  className = ''
}) => {
  const addModifier = () => {
    onChange({
      ...matrix,
      modifiers: [
        ...matrix.modifiers,
        { description: '', factor: 0 }
      ]
    });
  };

  const updateModifier = (index: number, field: 'description' | 'factor', value: string | number) => {
    const newModifiers = [...matrix.modifiers];
    newModifiers[index] = { 
      ...newModifiers[index], 
      [field]: field === 'factor' ? Number(value) : value 
    };
    
    onChange({
      ...matrix,
      modifiers: newModifiers
    });
  };

  const removeModifier = (index: number) => {
    onChange({
      ...matrix,
      modifiers: matrix.modifiers.filter((_, i) => i !== index)
    });
  };

  return (
    <div className={`p-4 border border-gray-200 rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Edit Cost Matrix</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Matrix Name
        </label>
        <input
          type="text"
          value={matrix.name}
          onChange={(e) => onChange({ ...matrix, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Enter matrix name"
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Base Cost ($)
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={matrix.baseCost}
          onChange={(e) => onChange({ ...matrix, baseCost: Number(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Enter base cost"
        />
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-md font-medium">Cost Modifiers</h4>
          <button 
            onClick={addModifier}
            className="px-3 py-1 bg-blue-600 text-white rounded-md flex items-center text-sm"
          >
            <Plus size={16} className="mr-1" /> Add Modifier
          </button>
        </div>
        
        {matrix.modifiers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-md">
            No modifiers added yet. Click "Add Modifier" to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {matrix.modifiers.map((modifier, index) => (
              <div key={index} className="flex space-x-3 items-start p-3 border border-gray-200 rounded-md">
                <div className="flex-grow">
                  <input
                    type="text"
                    value={modifier.description}
                    onChange={(e) => updateModifier(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                    placeholder="Description"
                  />
                  <div className="flex items-center">
                    <span className="mr-2 text-sm text-gray-600">Factor:</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={modifier.factor}
                      onChange={(e) => updateModifier(index, 'factor', e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => removeModifier(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};