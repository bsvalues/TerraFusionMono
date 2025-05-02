-- V4__audit_columns.sql
-- Add audit tracking columns to critical tables

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Add audit columns to property table
ALTER TABLE appraisal.property
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(50);

-- Create trigger for property
DROP TRIGGER IF EXISTS set_property_updated_at ON appraisal.property;
CREATE TRIGGER set_property_updated_at
BEFORE UPDATE ON appraisal.property
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add audit columns to land_parcel table
ALTER TABLE appraisal.land_parcel
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(50);

-- Create trigger for land_parcel
DROP TRIGGER IF EXISTS set_land_parcel_updated_at ON appraisal.land_parcel;
CREATE TRIGGER set_land_parcel_updated_at
BEFORE UPDATE ON appraisal.land_parcel
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add audit columns to improvement table
ALTER TABLE appraisal.improvement
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(50);

-- Create trigger for improvement
DROP TRIGGER IF EXISTS set_improvement_updated_at ON appraisal.improvement;
CREATE TRIGGER set_improvement_updated_at
BEFORE UPDATE ON appraisal.improvement
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add audit columns to levy_bill table
ALTER TABLE billing.levy_bill
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(50);

-- Create trigger for levy_bill
DROP TRIGGER IF EXISTS set_levy_bill_updated_at ON billing.levy_bill;
CREATE TRIGGER set_levy_bill_updated_at
BEFORE UPDATE ON billing.levy_bill
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add audit columns to special_assessment table
ALTER TABLE billing.special_assessment
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(50);

-- Create trigger for special_assessment
DROP TRIGGER IF EXISTS set_special_assessment_updated_at ON billing.special_assessment;
CREATE TRIGGER set_special_assessment_updated_at
BEFORE UPDATE ON billing.special_assessment
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();