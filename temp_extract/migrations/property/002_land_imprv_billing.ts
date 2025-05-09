
/* Auto‑generated by TerraFusion migration bundle */
import { pgTable, uuid, varchar, numeric, integer, date, char } from 'drizzle-orm/pg-core';
import { property, levy } from './001_init';

export const landParcel = pgTable('land_parcel', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').notNull().references(() => property.id),
  typeCode: char('type_code', { length: 10 }),
  acreage: numeric('acreage', { precision: 10, scale: 3 }),
  valuation: numeric('valuation', { precision: 14, scale: 2 }),
});

export const improvement = pgTable('improvement', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').notNull().references(() => property.id),
  typeCode: char('type_code', { length: 5 }),
  yearBuilt: integer('year_built'),
  replacementCost: numeric('replacement_cost', { precision: 14, scale: 2 }),
});

export const levyBill = pgTable('levy_bill', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').references(() => property.id),
  levyId: uuid('levy_id').references(() => levy.id),
  billedAmount: numeric('billed_amount', { precision: 14, scale: 2 }),
  dueDate: date('due_date'),
  status: varchar('status', { length: 20 }).default('UNPAID'),
});

export const payment = pgTable('payment', {
  id: uuid('id').primaryKey().defaultRandom(),
  billId: uuid('bill_id').references(() => levyBill.id),
  tenderDate: date('tender_date'),
  amount: numeric('amount', { precision: 14, scale: 2 }),
});
