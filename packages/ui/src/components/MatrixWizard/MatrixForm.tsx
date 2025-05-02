import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface MatrixFormProps {
  matrix: {
    name: string;
    baseCost: number;
    modifiers: { description: string; factor: number }[];
  };
  setMatrix: React.Dispatch<React.SetStateAction<{
    name: string;
    baseCost: number;
    modifiers: { description: string; factor: number }[];
  }>>;
}

// Form validation schema
const formSchema = z.object({
  name: z.string().min(3, { message: 'Matrix name must be at least 3 characters' }),
  baseCost: z.coerce.number().positive({ message: 'Base cost must be greater than 0' }),
  matrixType: z.string().optional()
});

// Matrix types/templates with preset base costs
const matrixTypes = [
  { value: 'standard_residential', label: 'Standard Residential', baseCost: 1500 },
  { value: 'luxury_residential', label: 'Luxury Residential', baseCost: 3000 },
  { value: 'standard_commercial', label: 'Standard Commercial', baseCost: 2500 },
  { value: 'industrial', label: 'Industrial Property', baseCost: 2000 },
  { value: 'agricultural', label: 'Agricultural Land', baseCost: 1200 },
  { value: 'special_purpose', label: 'Special Purpose', baseCost: 2800 },
  { value: 'custom', label: 'Custom Matrix', baseCost: 0 }
];

export const MatrixForm: React.FC<MatrixFormProps> = ({ matrix, setMatrix }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: matrix.name,
      baseCost: matrix.baseCost,
      matrixType: ''
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setMatrix(prev => ({
      ...prev,
      name: values.name,
      baseCost: values.baseCost
    }));
  };

  // Handle matrix type template selection
  const handleMatrixTypeChange = (value: string) => {
    const selectedType = matrixTypes.find(type => type.value === value);
    
    if (selectedType) {
      // Auto-fill name and base cost based on selected template
      if (value !== 'custom') {
        form.setValue('name', selectedType.label);
        form.setValue('baseCost', selectedType.baseCost);
        
        // Update parent state
        setMatrix(prev => ({
          ...prev,
          name: selectedType.label,
          baseCost: selectedType.baseCost
        }));
      }
    }
  };

  // Update parent state when form values change
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      // Only update when we have actual values
      if (value.name && value.baseCost !== undefined) {
        setMatrix(prev => ({
          ...prev,
          name: value.name as string,
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

export default MatrixForm;