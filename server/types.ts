/**
 * Server-side type definitions for the valuation wizards
 */

// Cost Matrix definition
export interface CostMatrix {
  matrixId?: string;
  name: string;
  baseCost: number;
  modifiers: {
    description: string;
    factor: number;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Income Schedule definition
export interface IncomeSchedule {
  scheduleId?: string;
  propertyType: string;
  grossIncome: number;
  vacancyRate: number;
  operatingExpenses: number;
  capRate: number;
  createdAt?: Date;
  updatedAt?: Date;
}