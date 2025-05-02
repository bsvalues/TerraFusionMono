import React from 'react';
import { CostMatrix, IncomeSchedule } from '../../schemas/wizardSchemas';

interface PreviewChartProps {
  parcelId: string;
  matrix?: CostMatrix;
  income?: IncomeSchedule;
  className?: string;
}

export const PreviewChart: React.FC<PreviewChartProps> = ({ 
  parcelId, 
  matrix, 
  income, 
  className = '' 
}) => {
  if (!parcelId) {
    return (
      <div className={`p-6 border border-gray-200 rounded-lg bg-gray-50 text-center ${className}`}>
        Please enter a parcel ID to preview valuation
      </div>
    );
  }

  // Calculate a simulated value for display
  const getValue = (): number => {
    // This is a simplified calculation for demonstration
    if (matrix) {
      let value = matrix.baseCost;
      matrix.modifiers.forEach(mod => {
        value *= (1 + mod.factor);
      });
      return Math.round(value);
    } else if (income) {
      // NOI = Gross Income * (1 - Vacancy Rate) - Operating Expenses
      const noi = income.grossIncome * (1 - income.vacancyRate) - income.operatingExpenses;
      // Value = NOI / Cap Rate
      return Math.round(income.capRate > 0 ? noi / income.capRate : 0);
    }
    return 0;
  };

  const value = getValue();

  return (
    <div className={`p-6 border border-gray-200 rounded-lg ${className}`}>
      <div className="text-sm text-gray-500 mb-2">Valuation preview for parcel</div>
      <div className="text-lg font-semibold mb-4">{parcelId}</div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">Estimated Value:</div>
        <div className="text-2xl font-bold text-blue-600">${value.toLocaleString()}</div>
      </div>
      
      {matrix && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm font-medium mb-2">Applied Matrix: {matrix.name}</div>
          <div className="text-sm text-gray-600">Base Cost: ${matrix.baseCost.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Modifiers: {matrix.modifiers.length}</div>
        </div>
      )}
      
      {income && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm font-medium mb-2">Income Schedule: {income.propertyType}</div>
          <div className="text-sm text-gray-600">Gross Income: ${income.grossIncome.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Cap Rate: {(income.capRate * 100).toFixed(2)}%</div>
        </div>
      )}
    </div>
  );
};