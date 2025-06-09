import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface IncomeFormProps {
  incomeData: {
    propertyType: string;
    grossIncome: number;
    vacancyRate: number;
    operatingExpenses: number;
    capRate: number;
  };
  setIncomeData: React.Dispatch<React.SetStateAction<{
    propertyType: string;
    grossIncome: number;
    vacancyRate: number;
    operatingExpenses: number;
    capRate: number;
  }>>;
}

// Form validation schema
const formSchema = z.object({
  propertyType: z.string().min(1, { message: 'Property type is required' }),
  grossIncome: z.coerce.number().positive({ message: 'Gross income must be greater than 0' }),
  vacancyRate: z.coerce.number().min(0).max(1, { message: 'Vacancy rate must be between 0 and 1' }),
  operatingExpenses: z.coerce.number().min(0, { message: 'Operating expenses cannot be negative' }),
  capRate: z.coerce.number().min(0.01).max(0.25, { message: 'Cap rate must be between 0.01 and 0.25' })
});

export const IncomeForm: React.FC<IncomeFormProps> = ({ incomeData, setIncomeData }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: incomeData,
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIncomeData(values);
  };

  // Update parent state when form values change
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.propertyType !== undefined) {
        setIncomeData(current => ({
          ...current,
          ...value as any
        }));
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, setIncomeData]);

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onChange={() => form.handleSubmit(onSubmit)()} className="space-y-8">
            <FormField
              control={form.control}
              name="propertyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="multifamily">Multi-family</SelectItem>
                      <SelectItem value="mixed">Mixed-use</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                      <SelectItem value="special">Special Purpose</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the type of property for accurate valuation
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
                        field.onChange(e);
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          form.setValue("grossIncome", value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Total annual rental income before expenses
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
                  <FormLabel>Vacancy Rate ({(field.value * 100).toFixed(0)}%)</FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      min={0}
                      max={0.5}
                      step={0.01}
                      onValueChange={(value) => {
                        field.onChange(value[0]);
                        form.setValue("vacancyRate", value[0]);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Expected percentage of time the property will be vacant
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
                      onChange={(e) => {
                        field.onChange(e);
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          form.setValue("operatingExpenses", value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Total annual costs for property maintenance, taxes, insurance, etc.
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
                      max={0.25}
                      step={0.005}
                      onValueChange={(value) => {
                        field.onChange(value[0]);
                        form.setValue("capRate", value[0]);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Rate of return expected by investors in the market for this property type
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

export default IncomeForm;