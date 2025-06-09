import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  ImportFile,
  ImportType,
  MappingConfig,
  ValidationIssue,
  ValidationResult
} from './types';
import axios from 'axios';

type ValidationReportProps = {
  importType: ImportType;
  files: ImportFile[];
  mapping: MappingConfig;
  onValidationComplete: (result: ValidationResult) => void;
  onBack: () => void;
};

export function ValidationReport({
  importType,
  files,
  mapping,
  onValidationComplete,
  onBack
}: ValidationReportProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Start validation when the component mounts
  useEffect(() => {
    startValidation();
  }, []);

  // Filter issues based on severity and active tab
  const filteredIssues = validationResult?.issues.filter(issue => {
    if (activeTab === 'all') return true;
    return issue.severity === activeTab;
  }) || [];

  // Function to start the validation process
  const startValidation = async () => {
    setValidating(true);
    setProgress(0);
    setValidationError(null);

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      
      // Add the first file to the FormData
      if (files.length > 0) {
        // Since we don't have access to the actual File object, we'd normally add it like this:
        // formData.append('file', files[0].fileObject);
        
        // For this implementation, we'll mock the API call
        simulateValidation();
        return;
      }
      
      // Add mapping configuration
      formData.append('mapping', JSON.stringify(mapping));
      
      // Make API call to validate the file
      const response = await axios.post(`/api/import/${importType}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setProgress(percentCompleted);
        }
      });
      
      // Update validation result
      setValidationResult(response.data);
      onValidationComplete(response.data);
      setValidating(false);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationError('An error occurred during validation. Please try again.');
      setValidating(false);
    }
  };

  // Function to simulate validation when we don't have an actual API
  const simulateValidation = () => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(Math.min(currentProgress, 100));
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        
        // Create mock validation result
        const mockResult: ValidationResult = {
          valid: true,
          totalRows: 250,
          processedRows: 250,
          issues: [
            {
              row: 12,
              column: 'date',
              value: '2023-13-45',
              message: 'Invalid date format. Expected YYYY-MM-DD.',
              severity: 'error'
            },
            {
              row: 45,
              column: 'soil_ph',
              value: '14.2',
              message: 'Value out of valid range (0-14).',
              severity: 'error'
            },
            {
              row: 78,
              column: 'latitude',
              value: '91.5',
              message: 'Latitude must be between -90 and 90.',
              severity: 'error'
            },
            {
              row: 98,
              column: 'crop_type',
              value: 'wheat2',
              message: 'Unknown crop type. Did you mean "wheat"?',
              severity: 'warning'
            },
            {
              row: 112,
              column: 'field_name',
              value: 'North Field',
              message: 'Duplicate field name.',
              severity: 'warning'
            },
            {
              row: 145,
              column: 'notes',
              value: '',
              message: 'Empty notes field.',
              severity: 'info'
            },
            {
              row: 189,
              column: 'moisture',
              value: '15%',
              message: 'Unit specified in value. Units should be in separate column.',
              severity: 'info'
            }
          ],
          summary: {
            errors: 3,
            warnings: 2,
            info: 2
          }
        };
        
        setValidationResult(mockResult);
        onValidationComplete(mockResult);
        setValidating(false);
      }
    }, 100);
  };

  // Severity icon mapping
  const severityIcon = {
    error: <AlertTriangle className="h-4 w-4 text-red-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    info: <Info className="h-4 w-4 text-blue-500" />
  };

  // Severity badge mapping
  const severityBadge = {
    error: <Badge variant="destructive">Error</Badge>,
    warning: <Badge variant="outline" className="border-amber-500 text-amber-500">Warning</Badge>,
    info: <Badge variant="outline" className="border-blue-500 text-blue-500">Info</Badge>
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Validation Report</h3>
      
      {validating ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Validating your data...</h4>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Please wait while we check your data for issues. This may take a few moments.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : validationError ? (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Validation Error</h4>
                <p className="text-sm text-red-700 mt-1">{validationError}</p>
                <Button onClick={startValidation} variant="outline" size="sm" className="mt-3">
                  Retry Validation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : validationResult ? (
        <div className="space-y-6">
          <Card className={validationResult.valid ? "border-green-200" : "border-red-200"}>
            <CardContent className="pt-6">
              <div className="flex items-start">
                {validationResult.valid ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-medium">
                    {validationResult.valid 
                      ? "Your data is ready to be imported" 
                      : "Your data has validation issues that need to be addressed"}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {validationResult.processedRows} of {validationResult.totalRows} rows processed.
                    {validationResult.summary.errors > 0 && (
                      <span className="text-red-600 ml-1">
                        {validationResult.summary.errors} errors
                      </span>
                    )}
                    {validationResult.summary.warnings > 0 && (
                      <span className="text-amber-600 ml-1">
                        {validationResult.summary.warnings} warnings
                      </span>
                    )}
                    {validationResult.summary.info > 0 && (
                      <span className="text-blue-600 ml-1">
                        {validationResult.summary.info} notices
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {validationResult.issues.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Validation Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">
                      All ({validationResult.issues.length})
                    </TabsTrigger>
                    <TabsTrigger value="error">
                      Errors ({validationResult.summary.errors})
                    </TabsTrigger>
                    <TabsTrigger value="warning">
                      Warnings ({validationResult.summary.warnings})
                    </TabsTrigger>
                    <TabsTrigger value="info">
                      Info ({validationResult.summary.info})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value={activeTab} className="mt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Severity</TableHead>
                          <TableHead>Row</TableHead>
                          <TableHead>Column</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredIssues.length > 0 ? (
                          filteredIssues.map((issue, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div className="flex items-center">
                                  {severityIcon[issue.severity]}
                                  <span className="sr-only">{issue.severity}</span>
                                </div>
                              </TableCell>
                              <TableCell>{issue.row}</TableCell>
                              <TableCell>{issue.column}</TableCell>
                              <TableCell>
                                <code className="bg-muted px-1 py-0.5 rounded text-xs">
                                  {issue.value || '<empty>'}
                                </code>
                              </TableCell>
                              <TableCell>{issue.message}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                              No issues found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          disabled={validating || !validationResult}
        >
          {validationResult?.valid ? "Import Data" : "Import with Errors"}
        </Button>
      </div>
    </div>
  );
}