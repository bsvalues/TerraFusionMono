import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertCircle, Clipboard, CheckCircle, Download, Calculator } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MatrixPreviewProps {
  matrix: {
    name: string;
    baseCost: number;
    modifiers: { description: string; factor: number }[];
  };
  matrixId: string | null;
}

// Format the factor as a percentage
const formatFactor = (factor: number) => {
  const percentage = (factor - 1) * 100;
  return percentage >= 0 ? `+${percentage.toFixed(0)}%` : `${percentage.toFixed(0)}%`;
};

// Get color class for the factor badge
const getFactorColorClass = (factor: number) => {
  if (factor > 1) return "bg-green-500/20 text-green-700 hover:bg-green-500/30";
  if (factor < 1) return "bg-red-500/20 text-red-700 hover:bg-red-500/30";
  return "bg-gray-200 text-gray-700 hover:bg-gray-300";
};

// Format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const MatrixPreview: React.FC<MatrixPreviewProps> = ({ matrix, matrixId }) => {
  const [copied, setCopied] = useState(false);
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);
  const [squareFootage, setSquareFootage] = useState("");
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Calculate final cost by applying all modifiers
  const calculateCost = (baseValue: number) => {
    return matrix.modifiers.reduce((acc, modifier) => {
      return acc * modifier.factor;
    }, baseValue);
  };

  // Handle calculation
  const handleCalculate = () => {
    const footage = parseFloat(squareFootage);
    
    if (isNaN(footage) || footage <= 0) {
      setCalculationError("Please enter a valid square footage greater than 0");
      setCalculatedValue(null);
      return;
    }
    
    setCalculationError(null);
    const baseValue = matrix.baseCost * footage;
    const finalValue = calculateCost(baseValue);
    setCalculatedValue(finalValue);
  };

  // Copy matrix details to clipboard
  const copyToClipboard = () => {
    const text = `
Cost Matrix: ${matrix.name}
ID: ${matrixId || 'Not saved'}
Base Cost: ${formatCurrency(matrix.baseCost)} per square unit

Modifiers:
${matrix.modifiers.map((m, i) => `${i+1}. ${m.description}: ${formatFactor(m.factor)}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Error copying to clipboard:', err));
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">{matrix.name}</h3>
              {matrixId && (
                <p className="text-sm text-muted-foreground">
                  ID: {matrixId.substring(0, 8)}...
                </p>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Clipboard className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium mb-3">Base Information</h4>
              <div className="bg-muted p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Base Cost:</span>
                  <span className="font-bold">{formatCurrency(matrix.baseCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modifiers:</span>
                  <span className="font-bold">{matrix.modifiers.length}</span>
                </div>
              </div>
              
              <h4 className="text-lg font-medium mt-6 mb-3">Cost Calculator</h4>
              <div className="bg-muted p-4 rounded-md">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Square Footage
                    </label>
                    <div className="flex space-x-2">
                      <Input 
                        type="number"
                        placeholder="Enter square footage"
                        value={squareFootage}
                        onChange={(e) => setSquareFootage(e.target.value)}
                      />
                      <Button onClick={handleCalculate}>
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculate
                      </Button>
                    </div>
                  </div>
                  
                  {calculationError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        {calculationError}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {calculatedValue !== null && (
                    <div className="bg-background p-4 rounded-md border">
                      <div className="text-sm text-muted-foreground mb-1">Estimated Cost:</div>
                      <div className="text-2xl font-bold">{formatCurrency(calculatedValue)}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Base: {formatCurrency(matrix.baseCost * parseFloat(squareFootage))} 
                        + Modifiers applied
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-medium mb-3">Modifiers</h4>
              {matrix.modifiers.length === 0 ? (
                <div className="bg-muted p-4 rounded-md text-center text-muted-foreground">
                  No modifiers defined
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Factor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matrix.modifiers.map((modifier, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{modifier.description}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={getFactorColorClass(modifier.factor)}>
                            {formatFactor(modifier.factor)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              <div className="mt-6 p-4 bg-muted/50 rounded-md text-sm text-muted-foreground">
                <p className="mb-2">
                  <strong>How this matrix works:</strong>
                </p>
                <p className="mb-2">
                  1. Start with the base cost ({formatCurrency(matrix.baseCost)}) per square unit
                </p>
                <p className="mb-2">
                  2. Multiply by the property square footage
                </p>
                <p className="mb-2">
                  3. Apply each modifier sequentially to calculate the final value
                </p>
                <p>
                  This matrix is ideal for {matrix.name.toLowerCase()} property types and can be used
                  for quick cost valuations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatrixPreview;