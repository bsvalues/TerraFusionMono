import React from 'react';
import { IncomeSchedule } from '../../schemas/wizardSchemas';

interface IncomeEditorProps {
  schedule: IncomeSchedule;
  onChange: (schedule: IncomeSchedule) => void;
  className?: string;
}

export const IncomeEditor: React.FC<IncomeEditorProps> = ({ 
  schedule, 
  onChange, 
  className = '' 
}) => {
  // Property type options
  const propertyTypes = [
    'Residential',
    'Commercial',
    'Industrial',
    'Agricultural',
    'Mixed-Use'
  ];

  // Helper to update a specific field
  const updateField = (field: keyof IncomeSchedule, value: string | number) => {
    onChange({
      ...schedule,
      [field]: typeof value === 'string' ? value : Number(value)
    });
  };

  return (
    <div className={`p-4 border border-gray-200 rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Edit Income Schedule</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Property Type
        </label>
        <select
          value={schedule.propertyType}
          onChange={(e) => updateField('propertyType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Select property type</option>
          {propertyTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
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
          onChange={(e) => updateField('grossIncome', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Enter gross annual income"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Vacancy Rate (0-1)
        </label>
        <input
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={schedule.vacancyRate}
          onChange={(e) => updateField('vacancyRate', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Enter vacancy rate (e.g., 0.05 for 5%)"
        />
        <div className="text-sm text-gray-500 mt-1">
          Current: {(schedule.vacancyRate * 100).toFixed(1)}%
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Annual Operating Expenses ($)
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={schedule.operatingExpenses}
          onChange={(e) => updateField('operatingExpenses', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Enter operating expenses"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Capitalization Rate (0-1)
        </label>
        <input
          type="number"
          min="0"
          max="1"
          step="0.001"
          value={schedule.capRate}
          onChange={(e) => updateField('capRate', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Enter cap rate (e.g., 0.06 for 6%)"
        />
        <div className="text-sm text-gray-500 mt-1">
          Current: {(schedule.capRate * 100).toFixed(2)}%
        </div>
      </div>
      
      <div className="mt-6 p-3 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium mb-2">Income Valuation Preview</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-gray-600">Effective Gross Income:</div>
          <div className="font-medium">${(schedule.grossIncome * (1 - schedule.vacancyRate)).toLocaleString()}</div>
          
          <div className="text-gray-600">Operating Expenses:</div>
          <div className="font-medium">${schedule.operatingExpenses.toLocaleString()}</div>
          
          <div className="text-gray-600">Net Operating Income:</div>
          <div className="font-medium">${(schedule.grossIncome * (1 - schedule.vacancyRate) - schedule.operatingExpenses).toLocaleString()}</div>
          
          <div className="text-gray-600 font-medium">Estimated Value:</div>
          <div className="font-bold text-blue-600">${schedule.capRate > 0 
            ? Math.round((schedule.grossIncome * (1 - schedule.vacancyRate) - schedule.operatingExpenses) / schedule.capRate).toLocaleString() 
            : 'N/A - Set cap rate'}</div>
        </div>
      </div>
    </div>
  );
};