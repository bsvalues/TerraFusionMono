-- V2__schema_reorganization.sql
-- Move tables into appropriate schemas based on their domain

-- Property-related tables to appraisal schema
ALTER TABLE IF EXISTS property SET SCHEMA appraisal;
ALTER TABLE IF EXISTS land_parcel SET SCHEMA appraisal;
ALTER TABLE IF EXISTS improvement SET SCHEMA appraisal;

-- Tax and payment-related tables to billing schema
ALTER TABLE IF EXISTS levy SET SCHEMA billing;
ALTER TABLE IF EXISTS levy_bill SET SCHEMA billing;
ALTER TABLE IF EXISTS payment SET SCHEMA billing;
ALTER TABLE IF EXISTS collection_transaction SET SCHEMA billing;
ALTER TABLE IF EXISTS special_assessment SET SCHEMA billing;

-- Update foreign key references
-- Note: PostgreSQL maintains FK relationships across schemas by default, 
-- so we don't need to drop and recreate them when moving tables between schemas