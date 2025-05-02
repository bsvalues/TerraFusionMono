import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertCircle, Clipboard, CheckCircle, Download, Calculator, PlusCircle, Trash2, ChevronUp, ChevronDown } from "lucide-react";

// Common interfaces
interface CostMatrix {
  name: string;
  baseCost: number;
  modifiers: { description: string; factor: number }[];
  matrixId?: string;
}

interface IncomeSchedule {
  propertyType: string;
  grossIncome: number;
  vacancyRate: number;
  operatingExpenses: number;
  capRate: number;
  scheduleId?: string;
}

// Helper functions
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

const formatFactor = (factor: number) => {
  const percentage = (factor - 1) * 100;
  return percentage >= 0 ? `+${percentage.toFixed(0)}%` : `${percentage.toFixed(0)}%`;
};

const getFactorColorClass = (factor: number) => {
  if (factor > 1) return "bg-green-500/20 text-green-700 hover:bg-green-500/30";
  if (factor < 1) return "bg-red-500/20 text-red-700 hover:bg-red-500/30";
  return "bg-gray-200 text-gray-700 hover:bg-gray-300";
};

// Custom components
const Stepper = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className="flex flex-col items-center space-y-2 flex-1"
            onClick={() => onStepClick(index)}
            style={{ cursor: index <= currentStep ? 'pointer' : 'default' }}
          >
            <div className="relative w-full">
              {/* Line before */}
              {index > 0 && (
                <div 
                  className={`absolute top-1/2 -translate-y-1/2 left-0 right-1/2 h-[2px] ${
                    index <= currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                />
              )}
              
              {/* Circle */}
              <div 
                className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                  index < currentStep 
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStep
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-muted-foreground/30 text-muted'
                }`}
              >
                {index < currentStep ? (
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              
              {/* Line after */}
              {index < steps.length - 1 && (
                <div 
                  className={`absolute top-1/2 -translate-y-1/2 left-1/2 right-0 h-[2px] ${
                    index < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                />
              )}
            </div>
            
            <div className="flex flex-col items-center text-center space-y-1">
              <span 
                className={`text-sm font-medium ${
                  index === currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
              <span className="text-xs text-muted-foreground hidden md:block">
                {step.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// MatrixWizard Components
const MatrixForm = ({ matrix, setMatrix }) => {
  const formSchema = z.object({
    name: z.string().min(3, { message: 'Matrix name must be at least 3 characters' }),
    baseCost: z.coerce.number().positive({ message: 'Base cost must be greater than 0' }),
    matrixType: z.string().optional()
  });

  const matrixTypes = [
    { value: 'standard_residential', label: 'Standard Residential', baseCost: 1500 },
    { value: 'luxury_residential', label: 'Luxury Residential', baseCost: 3000 },
    { value: 'standard_commercial', label: 'Standard Commercial', baseCost: 2500 },
    { value: 'industrial', label: 'Industrial Property', baseCost: 2000 },
    { value: 'agricultural', label: 'Agricultural Land', baseCost: 1200 },
    { value: 'special_purpose', label: 'Special Purpose', baseCost: 2800 },
    { value: 'custom', label: 'Custom Matrix', baseCost: 0 }
  ];

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: matrix.name,
      baseCost: matrix.baseCost,
      matrixType: ''
    },
  });

  const handleMatrixTypeChange = (value) => {
    const selectedType = matrixTypes.find(type => type.value === value);
    
    if (selectedType) {
      if (value !== 'custom') {
        form.setValue('name', selectedType.label);
        form.setValue('baseCost', selectedType.baseCost);
        
        setMatrix(prev => ({
          ...prev,
          name: selectedType.label,
          baseCost: selectedType.baseCost
        }));
      }
    }
  };

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.name && value.baseCost !== undefined) {
        setMatrix(prev => ({
          ...prev,
          name: value.name,
          baseCost: Number(value.baseCost) || 0
        }));
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch, setMatrix]);

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form className="space-y-6">
            <FormField
              control={form.control}
              name="matrixType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matrix Template (Optional)</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleMatrixTypeChange(value);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template or create custom" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {matrixTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose a template for quick setup or create a custom matrix
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matrix Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a descriptive name" {...field} />
                  </FormControl>
                  <FormDescription>
                    A clear name that describes this cost matrix
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="baseCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Cost ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter base cost"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          form.setValue("baseCost", value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    The baseline cost per square unit for this property type
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

const MatrixEditor = ({ matrix, setMatrix }) => {
  const [newModifier, setNewModifier] = useState({
    description: '',
    factor: 1.0
  });

  const addModifier = () => {
    if (!newModifier.description.trim()) return;
    
    setMatrix(prev => ({
      ...prev,
      modifiers: [...prev.modifiers, { ...newModifier }]
    }));
    
    setNewModifier({
      description: '',
      factor: 1.0
    });
  };

  const removeModifier = (index) => {
    setMatrix(prev => ({
      ...prev,
      modifiers: prev.modifiers.filter((_, i) => i !== index)
    }));
  };

  const moveModifierUp = (index) => {
    if (index === 0) return;
    
    setMatrix(prev => {
      const newModifiers = [...prev.modifiers];
      const temp = newModifiers[index];
      newModifiers[index] = newModifiers[index - 1];
      newModifiers[index - 1] = temp;
      return { ...prev, modifiers: newModifiers };
    });
  };

  const moveModifierDown = (index) => {
    if (index === matrix.modifiers.length - 1) return;
    
    setMatrix(prev => {
      const newModifiers = [...prev.modifiers];
      const temp = newModifiers[index];
      newModifiers[index] = newModifiers[index + 1];
      newModifiers[index + 1] = temp;
      return { ...prev, modifiers: newModifiers };
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Add Cost Modifiers</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Define factors that adjust the base cost up or down based on property characteristics.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3 items-end">
              <div className="md:col-span-3">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={newModifier.description}
                  onChange={(e) => setNewModifier(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Premium Location, Needs Renovation"
                  className="w-full"
                />
              </div>
              
              <div className="md:col-span-1">
                <label className="text-sm font-medium">Factor ({formatFactor(newModifier.factor)})</label>
                <Slider
                  value={[newModifier.factor]}
                  min={0.5}
                  max={2}
                  step={0.05}
                  onValueChange={(values) => setNewModifier(prev => ({ ...prev, factor: values[0] }))}
                  className="py-2"
                />
              </div>
              
              <div>
                <Button 
                  onClick={addModifier}
                  className="w-full"
                  disabled={!newModifier.description.trim()}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Current Modifiers</h3>
            
            {matrix.modifiers.length === 0 ? (
              <div className="bg-muted p-4 rounded-md text-center text-muted-foreground">
                No modifiers added yet. Add at least one modifier to continue.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[120px] text-center">Factor</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrix.modifiers.map((modifier, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{modifier.description}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={getFactorColorClass(modifier.factor)}>
                          {formatFactor(modifier.factor)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveModifierUp(index)}
                            disabled={index === 0}
                            className="h-8 w-8"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveModifierDown(index)}
                            disabled={index === matrix.modifiers.length - 1}
                            className="h-8 w-8"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeModifier(index)}
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MatrixPreview = ({ matrix, matrixId }) => {
  const [copied, setCopied] = useState(false);
  const [calculatedValue, setCalculatedValue] = useState(null);
  const [squareFootage, setSquareFootage] = useState("");
  const [calculationError, setCalculationError] = useState(null);

  const calculateCost = (baseValue) => {
    return matrix.modifiers.reduce((acc, modifier) => {
      return acc * modifier.factor;
    }, baseValue);
  };

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

// IncomeWizard components
const IncomeForm = ({ schedule, setSchedule }) => {
  const formSchema = z.object({
    propertyType: z.string({ required_error: "Please select a property type" }),
    grossIncome: z.coerce.number().positive({ message: "Gross income must be greater than 0" }),
    vacancyRate: z.coerce.number().min(0).max(1, { message: "Vacancy rate must be between 0 and 1" }),
    operatingExpenses: z.coerce.number().positive({ message: "Operating expenses must be greater than 0" }),
    capRate: z.coerce.number().min(0.01).max(0.3, { message: "Cap rate must be between 0.01 and 0.3" })
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: schedule
  });

  const propertyTypes = [
    { value: "residential", label: "Residential" },
    { value: "commercial", label: "Commercial" },
    { value: "industrial", label: "Industrial" },
    { value: "mixed", label: "Mixed Use" },
    { value: "special", label: "Special Purpose" }
  ];

  // Update parent state when form values change
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      // Only update when we have valid numbers
      if (
        value.propertyType &&
        !isNaN(Number(value.grossIncome)) &&
        !isNaN(Number(value.vacancyRate)) &&
        !isNaN(Number(value.operatingExpenses)) &&
        !isNaN(Number(value.capRate))
      ) {
        setSchedule({
          propertyType: value.propertyType,
          grossIncome: Number(value.grossIncome),
          vacancyRate: Number(value.vacancyRate),
          operatingExpenses: Number(value.operatingExpenses),
          capRate: Number(value.capRate)
        });
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch, setSchedule]);

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form className="space-y-6">
            <FormField
              control={form.control}
              name="propertyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The primary use classification of the property
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="grossIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Gross Income ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter annual gross income" 
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Total annual income from all rental units before expenses
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vacancyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vacancy Rate ({(field.value * 100).toFixed(1)}%)</FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      min={0}
                      max={0.30}
                      step={0.01}
                      onValueChange={(values) => field.onChange(values[0])}
                    />
                  </FormControl>
                  <FormDescription>
                    Expected percentage of unoccupied units (0-30%)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="operatingExpenses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Operating Expenses ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter annual operating expenses" 
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Total annual costs for property maintenance, insurance, taxes, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capitalization Rate ({(field.value * 100).toFixed(1)}%)</FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      min={0.01}
                      max={0.12}
                      step={0.0025}
                      onValueChange={(values) => field.onChange(values[0])}
                    />
                  </FormControl>
                  <FormDescription>
                    Rate of return based on property's income (1-12%)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

const IncomePreview = ({ schedule }) => {
  // Calculate important metrics
  const effectiveGrossIncome = schedule.grossIncome * (1 - schedule.vacancyRate);
  const netOperatingIncome = effectiveGrossIncome - schedule.operatingExpenses;
  const propertyValue = netOperatingIncome / schedule.capRate;
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold">Income Approach Valuation Preview</h3>
            <p className="text-sm text-muted-foreground">
              Review the income calculations for your {schedule.propertyType} property
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-muted p-4 rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Gross Income</div>
              <div className="text-2xl font-bold">{formatCurrency(schedule.grossIncome)}</div>
              <div className="text-xs text-muted-foreground mt-2">
                Annual rental income before deductions
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Vacancy Loss</div>
              <div className="text-2xl font-bold text-red-500">
                -{formatCurrency(schedule.grossIncome * schedule.vacancyRate)}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {formatPercentage(schedule.vacancyRate)} vacancy rate
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Effective Gross Income</div>
              <div className="text-2xl font-bold">{formatCurrency(effectiveGrossIncome)}</div>
              <div className="text-xs text-muted-foreground mt-2">
                Gross Income - Vacancy Loss
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Operating Expenses</div>
              <div className="text-2xl font-bold text-red-500">
                -{formatCurrency(schedule.operatingExpenses)}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Maintenance, taxes, insurance, etc.
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Net Operating Income (NOI)</div>
              <div className="text-2xl font-bold">{formatCurrency(netOperatingIncome)}</div>
              <div className="text-xs text-muted-foreground mt-2">
                Effective Gross Income - Operating Expenses
              </div>
            </div>
            
            <div className="bg-primary/10 p-4 rounded-md border-2 border-primary">
              <div className="text-sm text-primary mb-1">Estimated Property Value</div>
              <div className="text-2xl font-bold">{formatCurrency(propertyValue)}</div>
              <div className="text-xs text-muted-foreground mt-2">
                NOI ÷ Cap Rate ({formatPercentage(schedule.capRate)})
              </div>
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>How the Income Approach works:</strong>
            </p>
            <p className="mb-2">
              1. Start with the annual gross income from the property
            </p>
            <p className="mb-2">
              2. Subtract vacancy and credit losses
            </p>
            <p className="mb-2">
              3. Subtract operating expenses to get the Net Operating Income (NOI)
            </p>
            <p>
              4. Divide the NOI by the capitalization rate to determine the property value
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const IncomeResults = ({ schedule, scheduleId }) => {
  const [reportType, setReportType] = useState("summary");
  
  // Calculate important metrics
  const effectiveGrossIncome = schedule.grossIncome * (1 - schedule.vacancyRate);
  const netOperatingIncome = effectiveGrossIncome - schedule.operatingExpenses;
  const propertyValue = netOperatingIncome / schedule.capRate;
  
  // Format detailed metrics for property
  const getCapRateAnalysis = () => {
    if (schedule.capRate < 0.04) {
      return "Below market cap rate. This indicates low risk but also lower returns, typical of premium properties in high-demand areas.";
    } else if (schedule.capRate < 0.06) {
      return "Average market cap rate. This represents a balanced risk-return profile for this property type.";
    } else if (schedule.capRate < 0.08) {
      return "Above average cap rate. Higher returns may indicate increased risk or property located in an emerging market.";
    } else {
      return "High cap rate. This suggests significant potential returns but may come with higher risk or management challenges.";
    }
  };
  
  const getMarketPosition = () => {
    const ratio = schedule.operatingExpenses / schedule.grossIncome;
    if (ratio < 0.3) {
      return "Excellent expense ratio. Operating expenses are very efficiently managed compared to income.";
    } else if (ratio < 0.45) {
      return "Good expense ratio. Property operations are cost-effective and well-managed.";
    } else if (ratio < 0.6) {
      return "Average expense ratio. Standard operating costs for this property type.";
    } else {
      return "High expense ratio. Consider reviewing operations to reduce costs.";
    }
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold">Income Valuation Results</h3>
              <p className="text-sm text-muted-foreground">
                {scheduleId ? 'Schedule saved successfully' : 'Income schedule analysis complete'}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant={reportType === "summary" ? "default" : "outline"}
                size="sm"
                onClick={() => setReportType("summary")}
              >
                Summary
              </Button>
              <Button
                variant={reportType === "detailed" ? "default" : "outline"}
                size="sm"
                onClick={() => setReportType("detailed")}
              >
                Detailed
              </Button>
              <Button
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          {reportType === "summary" ? (
            <div className="space-y-4">
              <div className="bg-primary/10 p-6 rounded-md border border-primary">
                <div className="flex flex-col items-center text-center">
                  <div className="text-lg text-muted-foreground mb-2">Estimated Property Value</div>
                  <div className="text-4xl font-bold">
                    {formatCurrency(propertyValue)}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline">
                      {formatPercentage(schedule.capRate)} Cap Rate
                    </Badge>
                    <Badge variant="outline">
                      {schedule.propertyType.charAt(0).toUpperCase() + schedule.propertyType.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex flex-col gap-1">
                    <div className="text-sm text-muted-foreground">Gross Income</div>
                    <div className="text-xl font-bold">{formatCurrency(schedule.grossIncome)}</div>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex flex-col gap-1">
                    <div className="text-sm text-muted-foreground">Net Operating Income</div>
                    <div className="text-xl font-bold">{formatCurrency(netOperatingIncome)}</div>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex flex-col gap-1">
                    <div className="text-sm text-muted-foreground">Expense Ratio</div>
                    <div className="text-xl font-bold">
                      {formatPercentage(schedule.operatingExpenses / schedule.grossIncome)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Property Type</TableCell>
                    <TableCell className="text-right font-medium">
                      {schedule.propertyType.charAt(0).toUpperCase() + schedule.propertyType.slice(1)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Gross Annual Income</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(schedule.grossIncome)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Vacancy Rate</TableCell>
                    <TableCell className="text-right font-medium">{formatPercentage(schedule.vacancyRate)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Vacancy Loss</TableCell>
                    <TableCell className="text-right font-medium text-red-500">
                      -{formatCurrency(schedule.grossIncome * schedule.vacancyRate)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Effective Gross Income</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(effectiveGrossIncome)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Operating Expenses</TableCell>
                    <TableCell className="text-right font-medium text-red-500">
                      -{formatCurrency(schedule.operatingExpenses)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Net Operating Income (NOI)</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(netOperatingIncome)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Capitalization Rate</TableCell>
                    <TableCell className="text-right font-medium">{formatPercentage(schedule.capRate)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-primary/5">
                    <TableCell className="font-bold">Property Value</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(propertyValue)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert>
                  <div className="space-y-1">
                    <div className="font-medium">Cap Rate Analysis</div>
                    <div className="text-sm text-muted-foreground">
                      {getCapRateAnalysis()}
                    </div>
                  </div>
                </Alert>
                
                <Alert>
                  <div className="space-y-1">
                    <div className="font-medium">Market Position</div>
                    <div className="text-sm text-muted-foreground">
                      {getMarketPosition()}
                    </div>
                  </div>
                </Alert>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Components
export const MatrixWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [matrix, setMatrix] = useState({
    name: '',
    baseCost: 0,
    modifiers: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [savedMatrixId, setSavedMatrixId] = useState(null);

  const steps = [
    { label: 'Basic Details', description: 'Enter matrix name and base cost' },
    { label: 'Cost Modifiers', description: 'Add cost adjustment factors' },
    { label: 'Review', description: 'Verify your cost matrix' }
  ];

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

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Save to API
      const response = await fetch('/api/valuation/matrices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matrix),
      });

      if (!response.ok) {
        throw new Error('Error saving cost matrix');
      }

      const data = await response.json();
      setSavedMatrixId(data.matrix.matrixId);
      setIsLoading(false);
      
      // Go to preview step
      setCurrentStep(steps.length - 1);
    } catch (error) {
      console.error('Error saving cost matrix:', error);
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <MatrixForm 
            matrix={matrix} 
            setMatrix={setMatrix} 
          />
        );
      case 1:
        return (
          <MatrixEditor 
            matrix={matrix} 
            setMatrix={setMatrix} 
          />
        );
      case 2:
        return (
          <MatrixPreview 
            matrix={matrix}
            matrixId={savedMatrixId}
          />
        );
      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    if (currentStep === 0) {
      return !matrix.name || matrix.baseCost <= 0;
    }
    return false;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Cost Matrix Wizard</CardTitle>
        <CardDescription>
          Create and manage cost matrices for property valuation calculations
        </CardDescription>
      </CardHeader>
      
      <Stepper 
        steps={steps} 
        currentStep={currentStep} 
        onStepClick={(step) => {
          // Only allow clicking on previous steps or current step
          if (step <= currentStep) {
            setCurrentStep(step);
          }
        }} 
      />
      
      <CardContent className="pt-6">
        {renderStepContent()}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        
        {currentStep < steps.length - 1 ? (
          currentStep === steps.length - 2 ? (
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || matrix.modifiers.length === 0}
            >
              {isLoading ? 'Saving...' : 'Save Matrix'}
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={isNextDisabled()}
            >
              Next
            </Button>
          )
        ) : (
          <Button onClick={() => {
            setCurrentStep(0);
            setMatrix({
              name: '',
              baseCost: 0,
              modifiers: []
            });
            setSavedMatrixId(null);
          }}>
            Create New Matrix
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export const IncomeWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [schedule, setSchedule] = useState({
    propertyType: '',
    grossIncome: 0,
    vacancyRate: 0.05,
    operatingExpenses: 0,
    capRate: 0.06
  });
  const [isLoading, setIsLoading] = useState(false);
  const [savedScheduleId, setSavedScheduleId] = useState(null);

  const steps = [
    { label: 'Income Details', description: 'Enter property income information' },
    { label: 'Preview', description: 'Review calculated values' },
    { label: 'Results', description: 'View final valuation' }
  ];

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

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Save to API
      const response = await fetch('/api/valuation/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schedule),
      });

      if (!response.ok) {
        throw new Error('Error saving income schedule');
      }

      const data = await response.json();
      setSavedScheduleId(data.schedule.scheduleId);
      setIsLoading(false);
      
      // Go to results step
      setCurrentStep(steps.length - 1);
    } catch (error) {
      console.error('Error saving income schedule:', error);
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <IncomeForm 
            schedule={schedule} 
            setSchedule={setSchedule} 
          />
        );
      case 1:
        return (
          <IncomePreview 
            schedule={schedule} 
          />
        );
      case 2:
        return (
          <IncomeResults 
            schedule={schedule}
            scheduleId={savedScheduleId}
          />
        );
      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    if (currentStep === 0) {
      return !schedule.propertyType || 
             schedule.grossIncome <= 0 || 
             schedule.operatingExpenses <= 0;
    }
    return false;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Income Schedule Wizard</CardTitle>
        <CardDescription>
          Create income-based valuations for investment properties
        </CardDescription>
      </CardHeader>
      
      <Stepper 
        steps={steps} 
        currentStep={currentStep} 
        onStepClick={(step) => {
          // Only allow clicking on previous steps or current step
          if (step <= currentStep) {
            setCurrentStep(step);
          }
        }} 
      />
      
      <CardContent className="pt-6">
        {renderStepContent()}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        
        {currentStep < steps.length - 1 ? (
          currentStep === steps.length - 2 ? (
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Schedule'}
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={isNextDisabled()}
            >
              Next
            </Button>
          )
        ) : (
          <Button onClick={() => {
            setCurrentStep(0);
            setSchedule({
              propertyType: '',
              grossIncome: 0,
              vacancyRate: 0.05,
              operatingExpenses: 0,
              capRate: 0.06
            });
            setSavedScheduleId(null);
          }}>
            Create New Schedule
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Valuation Tools Tab View
export const ValuationTools = () => {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-3">
        <h1 className="text-3xl font-bold">Property Valuation Tools</h1>
        <p className="text-muted-foreground">
          Advanced tools for estimating property values using industry-standard methodologies
        </p>
      </div>

      <Tabs defaultValue="cost" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="cost">Cost Approach</TabsTrigger>
          <TabsTrigger value="income">Income Approach</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cost" className="focus-visible:outline-none focus-visible:ring-0">
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-md mb-6">
              <h2 className="text-xl font-semibold mb-2">Cost Approach Valuation</h2>
              <p className="text-sm text-muted-foreground">
                The cost approach estimates property value by calculating the cost to rebuild or replace 
                the structure, plus the value of the land, minus depreciation. This approach is particularly 
                useful for new construction, special use properties, or when market data is limited.
              </p>
            </div>
            
            <MatrixWizard />
          </div>
        </TabsContent>
        
        <TabsContent value="income" className="focus-visible:outline-none focus-visible:ring-0">
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-md mb-6">
              <h2 className="text-xl font-semibold mb-2">Income Approach Valuation</h2>
              <p className="text-sm text-muted-foreground">
                The income approach determines property value based on the income it generates. 
                By calculating the Net Operating Income (NOI) and applying a capitalization rate, 
                this method is ideal for income-producing properties like office buildings, retail spaces, 
                and apartment complexes.
              </p>
            </div>
            
            <IncomeWizard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ValuationTools;