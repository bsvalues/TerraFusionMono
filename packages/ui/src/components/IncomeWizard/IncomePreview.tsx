import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { PreviewChart } from '../shared/PreviewChart';

interface IncomePreviewProps {
  incomeData: {
    propertyType: string;
    grossIncome: number;
    vacancyRate: number;
    operatingExpenses: number;
    capRate: number;
  };
}

// Helper function to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper function to format percentage
const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

// Map property types to readable format
const propertyTypeMap: Record<string, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
  retail: 'Retail',
  office: 'Office',
  multifamily: 'Multi-family',
  mixed: 'Mixed-use',
  land: 'Land',
  special: 'Special Purpose'
};

export const IncomePreview: React.FC<IncomePreviewProps> = ({ incomeData }) => {
  // Calculate derived values
  const effectiveGrossIncome = incomeData.grossIncome * (1 - incomeData.vacancyRate);
  const netOperatingIncome = effectiveGrossIncome - incomeData.operatingExpenses;
  const propertyValue = netOperatingIncome / incomeData.capRate;

  // Prepare chart data
  const incomeChartData = [
    { name: 'Gross Income', value: incomeData.grossIncome },
    { name: 'Vacancy Loss', value: incomeData.grossIncome * incomeData.vacancyRate },
    { name: 'Operating Expenses', value: incomeData.operatingExpenses },
    { name: 'Net Operating Income', value: netOperatingIncome }
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Income Data Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property Type:</span>
                <span className="font-medium">{propertyTypeMap[incomeData.propertyType] || incomeData.propertyType}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Annual Income:</span>
                <span className="font-medium">{formatCurrency(incomeData.grossIncome)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vacancy Rate:</span>
                <span className="font-medium">{formatPercentage(incomeData.vacancyRate)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vacancy Loss:</span>
                <span className="font-medium">{formatCurrency(incomeData.grossIncome * incomeData.vacancyRate)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Effective Gross Income:</span>
                <span className="font-medium">{formatCurrency(effectiveGrossIncome)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operating Expenses:</span>
                <span className="font-medium">{formatCurrency(incomeData.operatingExpenses)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Net Operating Income:</span>
                <span className="font-medium">{formatCurrency(netOperatingIncome)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capitalization Rate:</span>
                <span className="font-medium">{formatPercentage(incomeData.capRate)}</span>
              </div>
              
              <div className="flex justify-between border-t pt-4 mt-4">
                <span className="font-semibold">Estimated Property Value:</span>
                <span className="font-bold text-xl">{formatCurrency(propertyValue)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Income and Expense Breakdown</h3>
            <div className="h-64">
              <PreviewChart data={incomeChartData} />
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>The property value is calculated using the income capitalization approach, dividing the net operating income by the capitalization rate.</p>
              <p className="mt-2">Formula: Property Value = Net Operating Income / Cap Rate</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomePreview;