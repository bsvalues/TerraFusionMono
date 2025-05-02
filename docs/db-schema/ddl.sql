-- DDL SQL file
-- This file contains the schema-only dump for the TerraFusion database
-- Generated from Drizzle ORM migration files

-- Core Tables
CREATE TABLE IF NOT EXISTS "property" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Other property fields would be defined here
);

CREATE TABLE IF NOT EXISTS "levy" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Other levy fields would be defined here
);

-- Land & Improvement Tables
CREATE TABLE IF NOT EXISTS "land_parcel" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "property_id" UUID NOT NULL REFERENCES "property"("id"),
  "type_code" CHAR(10),
  "acreage" NUMERIC(10,3),
  "valuation" NUMERIC(14,2)
);

CREATE TABLE IF NOT EXISTS "improvement" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "property_id" UUID NOT NULL REFERENCES "property"("id"),
  "type_code" CHAR(5),
  "year_built" INTEGER,
  "replacement_cost" NUMERIC(14,2)
);

-- Billing & Payment Tables
CREATE TABLE IF NOT EXISTS "levy_bill" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "property_id" UUID REFERENCES "property"("id"),
  "levy_id" UUID REFERENCES "levy"("id"),
  "billed_amount" NUMERIC(14,2),
  "due_date" DATE,
  "status" VARCHAR(20) DEFAULT 'UNPAID'
);

CREATE TABLE IF NOT EXISTS "payment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "bill_id" UUID REFERENCES "levy_bill"("id"),
  "tender_date" DATE,
  "amount" NUMERIC(14,2)
);

-- Collections & Assessments Tables
CREATE TABLE IF NOT EXISTS "collection_transaction" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "property_id" UUID REFERENCES "property"("id"),
  "tx_type" VARCHAR(20),
  "tx_date" DATE,
  "amount" NUMERIC(14,2)
);

CREATE TABLE IF NOT EXISTS "special_assessment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "property_id" UUID REFERENCES "property"("id"),
  "agency_code" VARCHAR(10),
  "description" VARCHAR(100),
  "assessment_amount" NUMERIC(14,2),
  "start_year" INTEGER,
  "end_year" INTEGER
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_land_parcel_property_id" ON "land_parcel"("property_id");
CREATE INDEX IF NOT EXISTS "idx_improvement_property_id" ON "improvement"("property_id");
CREATE INDEX IF NOT EXISTS "idx_levy_bill_property_id" ON "levy_bill"("property_id");
CREATE INDEX IF NOT EXISTS "idx_levy_bill_levy_id" ON "levy_bill"("levy_id");
CREATE INDEX IF NOT EXISTS "idx_payment_bill_id" ON "payment"("bill_id");
CREATE INDEX IF NOT EXISTS "idx_collection_transaction_property_id" ON "collection_transaction"("property_id");
CREATE INDEX IF NOT EXISTS "idx_special_assessment_property_id" ON "special_assessment"("property_id");