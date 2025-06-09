import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Download, Copy, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface IncomeResultsProps {
  incomeData: {
    propertyType: string;
    grossIncome: number;
    vacancyRate: number;
    operatingExpenses: number;
    capRate: number;
  };
  scheduleId: string | null;
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

export const IncomeResults: React.FC<IncomeResultsProps> = ({ incomeData, scheduleId }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate valuation results
  const effectiveGrossIncome = incomeData.grossIncome * (1 - incomeData.vacancyRate);
  const netOperatingIncome = effectiveGrossIncome - incomeData.operatingExpenses;
  const propertyValue = netOperatingIncome / incomeData.capRate;
  const expenseRatio = incomeData.operatingExpenses / effectiveGrossIncome;
  
  // Generate PDF report from API
  const generatePdf = async () => {
    if (!scheduleId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Simulated PDF generation - in a real application, this would call an API endpoint
      // to generate and return a PDF or a URL to download the PDF
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Set a dummy PDF URL - in a real app, this would be the URL returned from the API
      setPdfUrl(`/api/valuation/schedules/${scheduleId}/pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF report. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Copy results to clipboard
  const copyToClipboard = () => {
    const resultText = `
Property Valuation Results
-------------------------
Property Type: ${propertyTypeMap[incomeData.propertyType] || incomeData.propertyType}
Gross Income: ${formatCurrency(incomeData.grossIncome)}
Vacancy Rate: ${formatPercentage(incomeData.vacancyRate)}
Effective Gross Income: ${formatCurrency(effectiveGrossIncome)}
Operating Expenses: ${formatCurrency(incomeData.operatingExpenses)}
Net Operating Income: ${formatCurrency(netOperatingIncome)}
Cap Rate: ${formatPercentage(incomeData.capRate)}
Estimated Property Value: ${formatCurrency(propertyValue)}
Expense Ratio: ${formatPercentage(expenseRatio)}
    `.trim();

    navigator.clipboard.writeText(resultText)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        setError('Failed to copy to clipboard');
      });
  };

  useEffect(() => {
    // When component mounts, generate PDF if we have a scheduleId
    if (scheduleId) {
      generatePdf();
    }
  }, [scheduleId]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Valuation Results</h3>
          <Badge variant="outline" className="text-sm px-3 py-1">
            ID: {scheduleId ? scheduleId.substring(0, 8) : 'Not Saved'}
          </Badge>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-muted p-6 rounded-lg mb-6">
          <h4 className="text-lg font-semibold mb-2">Estimated Property Value</h4>
          <div className="text-3xl font-bold mb-2">{formatCurrency(propertyValue)}</div>
          <p className="text-muted-foreground">
            Based on {formatCurrency(netOperatingIncome)} NOI at {formatPercentage(incomeData.capRate)} cap rate
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-md font-semibold mb-3">Income Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property Type:</span>
                <span>{propertyTypeMap[incomeData.propertyType] || incomeData.propertyType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Income:</span>
                <span>{formatCurrency(incomeData.grossIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vacancy Loss:</span>
                <span>{formatCurrency(incomeData.grossIncome * incomeData.vacancyRate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Effective Gross Income:</span>
                <span>{formatCurrency(effectiveGrossIncome)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-3">Expense & Return Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operating Expenses:</span>
                <span>{formatCurrency(incomeData.operatingExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Net Operating Income:</span>
                <span>{formatCurrency(netOperatingIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expense Ratio:</span>
                <span>{formatPercentage(expenseRatio)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cap Rate:</span>
                <span>{formatPercentage(incomeData.capRate)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={copyToClipboard}
            disabled={copySuccess}
          >
            {copySuccess ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Results
              </>
            )}
          </Button>
          
          <Button
            variant="default"
            className="flex items-center gap-2"
            onClick={generatePdf}
            disabled={loading || !scheduleId}
          >
            <Download className="h-4 w-4" />
            {loading ? 'Generating PDF...' : 'Download Report'}
          </Button>

          {pdfUrl && !loading && (
            <Button 
              variant="secondary" 
              className="flex items-center gap-2"
              asChild
            >
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
                Open PDF
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomeResults;