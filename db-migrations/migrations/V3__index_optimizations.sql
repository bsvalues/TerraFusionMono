-- V3__index_optimizations.sql
-- Optimize indexes and add constraints for better query performance

-- Add indexes for land_parcel table
CREATE INDEX IF NOT EXISTS idx_land_parcel_type_code 
ON appraisal.land_parcel(type_code);

CREATE INDEX IF NOT EXISTS idx_land_parcel_valuation 
ON appraisal.land_parcel(valuation);

-- Add indexes for improvement table
CREATE INDEX IF NOT EXISTS idx_improvement_type_code 
ON appraisal.improvement(type_code);

CREATE INDEX IF NOT EXISTS idx_improvement_year_built 
ON appraisal.improvement(year_built);

-- Add indexes for levy_bill table
CREATE INDEX IF NOT EXISTS idx_levy_bill_due_date 
ON billing.levy_bill(due_date);

CREATE INDEX IF NOT EXISTS idx_levy_bill_status 
ON billing.levy_bill(status);

-- Add indexes for payment table
CREATE INDEX IF NOT EXISTS idx_payment_tender_date 
ON billing.payment(tender_date);

-- Add indexes for special_assessment table
CREATE INDEX IF NOT EXISTS idx_special_assessment_agency
ON billing.special_assessment(agency_code);

CREATE INDEX IF NOT EXISTS idx_special_assessment_years
ON billing.special_assessment(start_year, end_year);

-- Add constraints where missing
ALTER TABLE billing.levy_bill 
ALTER COLUMN status SET DEFAULT 'UNPAID';

-- Add optimized compound indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_property_levy_bill
ON billing.levy_bill(property_id, levy_id, status);