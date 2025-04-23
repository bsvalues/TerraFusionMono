import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { InfoIcon, PlayIcon, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface PluginData {
  name: string;
  version: string;
  description: string;
  entryPoint: string;
  code: string;
  hasQuotas: boolean;
  cpuMs: number;
  memKb: number;
}

interface PluginTestStepProps {
  pluginData: PluginData;
}

interface TestResult {
  status: 'success' | 'error';
  output: any;
  executionTime: number;
  memoryUsage: number;
  logs: string[];
}

export default function PluginTestStep({ pluginData }: PluginTestStepProps) {
  const [testInput, setTestInput] = useState<string>(JSON.stringify({
    id: "parcel-123",
    type: "residential",
    size: 2500,
    location: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    zoning: "R1",
    buildingCount: 1
  }, null, 2));
  
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'complete'>('idle');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  
  const runTest = () => {
    setTestStatus('running');
    
    // Simulate processing time
    setTimeout(() => {
      let parsedInput;
      try {
        parsedInput = JSON.parse(testInput);
      } catch (error) {
        setTestResult({
          status: 'error',
          output: { error: 'Invalid JSON input' },
          executionTime: 0,
          memoryUsage: 0,
          logs: ['Error: Failed to parse input data']
        });
        setTestStatus('complete');
        return;
      }
      
      // Simulate a plugin execution
      try {
        // This is a mock implementation to simulate plugin execution
        // In a real implementation, this would use a sandbox to run the plugin code
        
        const executionTime = Math.floor(Math.random() * (pluginData.cpuMs * 0.8)) + 50;
        const memoryUsage = Math.floor(Math.random() * (pluginData.memKb * 0.7)) + 1024;
        
        // Simulate some logs
        const logs = [
          'Plugin execution started',
          `Processing data: ${JSON.stringify(parsedInput.id)}`,
          'Analyzing property characteristics'
        ];
        
        // Generate a plausible result based on the input data
        let output;
        if (parsedInput.type === 'residential') {
          output = {
            result: 'Analysis complete',
            score: 0.85,
            categories: ['residential', 'urban'],
            propertyValue: '$750,000',
            riskFactors: ['Moderate flood risk'],
            recommendations: [
              'Consider flood insurance',
              'Property shows good investment potential'
            ]
          };
          logs.push('Residential property analyzed successfully');
        } else {
          output = {
            result: 'Analysis complete',
            score: 0.72,
            categories: ['commercial', 'urban'],
            propertyValue: '$1,250,000',
            riskFactors: ['Moderate earthquake risk'],
            recommendations: [
              'Structural assessment recommended',
              'Consider business interruption insurance'
            ]
          };
          logs.push('Commercial property analyzed successfully');
        }
        
        logs.push('Plugin execution completed');
        
        setTestResult({
          status: 'success',
          output,
          executionTime,
          memoryUsage,
          logs
        });
      } catch (error) {
        setTestResult({
          status: 'error',
          output: { error: 'Plugin execution failed' },
          executionTime: 120,
          memoryUsage: 2048,
          logs: ['Error: Exception during plugin execution', error?.toString() || 'Unknown error']
        });
      }
      
      setTestStatus('complete');
    }, 1500);
  };
  
  const resetTest = () => {
    setTestStatus('idle');
    setTestResult(null);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Test Your Plugin</h3>
        <p className="text-sm text-muted-foreground">
          Test your plugin with sample data to see how it performs.
        </p>
      </div>
      
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Testing Environment</AlertTitle>
        <AlertDescription>
          Your plugin will be executed in a sandboxed environment with the resource quotas you defined.
          This lets you verify that your plugin functions correctly within its constraints.
        </AlertDescription>
      </Alert>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-input">Test Input Data (JSON)</Label>
            <Textarea 
              id="test-input"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              className="font-mono h-[250px]"
              placeholder="Enter JSON test data here"
              disabled={testStatus === 'running'}
            />
            <p className="text-xs text-muted-foreground">
              This data will be passed to your plugin's analyze function.
            </p>
          </div>
          
          <Button
            onClick={runTest}
            disabled={testStatus === 'running'}
            className="w-full"
          >
            {testStatus === 'running' ? (
              <>Running Test...</>
            ) : (
              <>
                <PlayIcon className="mr-2 h-4 w-4" /> Run Test
              </>
            )}
          </Button>
          
          {testStatus === 'running' && (
            <div className="space-y-2">
              <Progress value={45} />
              <p className="text-xs text-center text-muted-foreground">
                Executing plugin in sandbox...
              </p>
            </div>
          )}
        </div>
        
        <div>
          {testStatus === 'complete' && testResult && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Test Results</CardTitle>
                  <Badge variant={testResult.status === 'success' ? 'default' : 'destructive'}>
                    {testResult.status === 'success' ? 'Success' : 'Error'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-sm">Resource Usage</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted rounded-md p-2">
                      <p className="text-xs text-muted-foreground">CPU Time</p>
                      <p className="font-medium">{testResult.executionTime}ms</p>
                      <Progress 
                        value={(testResult.executionTime / pluginData.cpuMs) * 100} 
                        className="h-1 mt-1"
                      />
                    </div>
                    <div className="bg-muted rounded-md p-2">
                      <p className="text-xs text-muted-foreground">Memory</p>
                      <p className="font-medium">{(testResult.memoryUsage / 1024).toFixed(1)}MB</p>
                      <Progress 
                        value={(testResult.memoryUsage / pluginData.memKb) * 100} 
                        className="h-1 mt-1"
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-1">
                  <Label className="text-sm">Console Output</Label>
                  <div className="bg-black rounded-md p-2 max-h-24 overflow-y-auto">
                    {testResult.logs.map((log, index) => (
                      <div key={index} className="text-xs text-white font-mono">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-1">
                  <Label className="text-sm">Plugin Output</Label>
                  <div className="bg-muted rounded-md p-2 max-h-32 overflow-y-auto">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(testResult.output, null, 2)}
                    </pre>
                  </div>
                </div>
                
                {testResult.status === 'success' ? (
                  <Alert variant="success" className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Test Passed</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Your plugin executed successfully within the resource quotas.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Test Failed</AlertTitle>
                    <AlertDescription>
                      Your plugin encountered an error during execution.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              
              <CardFooter>
                <Button
                  variant="outline"
                  onClick={resetTest}
                  className="w-full"
                >
                  Run Another Test
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {testStatus === 'idle' && (
            <Alert variant="default" className="h-full flex flex-col justify-center items-center border-dashed">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <AlertTitle className="text-center">No Test Results Yet</AlertTitle>
              <AlertDescription className="text-center">
                Click "Run Test" to see how your plugin performs.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
      
      <Alert className="bg-blue-50 border-blue-200">
        <InfoIcon className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Testing Tips</AlertTitle>
        <AlertDescription className="text-blue-700">
          <ul className="list-disc list-inside space-y-1">
            <li>Try different inputs to ensure your plugin handles various scenarios</li>
            <li>Check for performance issues if you're approaching your resource quotas</li>
            <li>Review console output for debugging information</li>
            <li>Make sure your plugin handles invalid inputs gracefully</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}