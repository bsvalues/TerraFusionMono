import { z } from 'zod';

// Cost Matrix definition
export const CostMatrixSchema = z.object({
  matrixId: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  baseCost: z.number().nonnegative("Base cost must be a positive number"),
  modifiers: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    factor: z.number().nonnegative("Factor must be a positive number"),
  })),
});

// Income Schedule definition
export const IncomeScheduleSchema = z.object({
  scheduleId: z.string().uuid().optional(),
  propertyType: z.string().min(1, "Property type is required"),
  grossIncome: z.number().nonnegative("Gross income must be a positive number"),
  vacancyRate: z.number().min(0, "Vacancy rate must be between 0 and 1").max(1, "Vacancy rate must be between 0 and 1"),
  operatingExpenses: z.number().nonnegative("Operating expenses must be a positive number"),
  capRate: z.number().min(0, "Cap rate must be between 0 and 1").max(1, "Cap rate must be between 0 and 1"),
});

export type CostMatrix = z.infer<typeof CostMatrixSchema>;
export type IncomeSchedule = z.infer<typeof IncomeScheduleSchema>;

// Types for creating new instances
export type NewCostMatrix = Omit<CostMatrix, 'matrixId'>;
export type NewIncomeSchedule = Omit<IncomeSchedule, 'scheduleId'>;