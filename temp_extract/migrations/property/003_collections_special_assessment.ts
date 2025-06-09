
/* Collections & special assessments */
import { pgTable, uuid, numeric, date, varchar, integer } from 'drizzle-orm/pg-core';
import { property } from './001_init';

export const collectionTransaction = pgTable('collection_transaction', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').references(() => property.id),
  txType: varchar('tx_type', { length: 20 }),
  txDate: date('tx_date'),
  amount: numeric('amount', { precision: 14, scale: 2 }),
});

export const specialAssessment = pgTable('special_assessment', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').references(() => property.id),
  agencyCode: varchar('agency_code', { length: 10 }),
  description: varchar('description', { length: 100 }),
  assessmentAmount: numeric('assessment_amount', { precision: 14, scale: 2 }),
  startYear: integer('start_year'),
  endYear: integer('end_year'),
});
