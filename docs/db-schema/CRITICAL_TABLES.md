# Critical Tables

This document contains SQL snippets to get row-counts for the six hot tables driving valuation in the TerraFusion system.

## Property Table - Core Properties

```sql
-- Count of all properties in the system
SELECT COUNT(*) AS total_properties FROM property;

-- Count of properties by status (if status field exists)
-- SELECT status, COUNT(*) AS count FROM property GROUP BY status ORDER BY count DESC;
```

## Land Parcel Table - Physical Land Records

```sql
-- Count of all land parcels in the system
SELECT COUNT(*) AS total_land_parcels FROM land_parcel;

-- Count of parcels by type
SELECT type_code, COUNT(*) AS count 
FROM land_parcel 
GROUP BY type_code 
ORDER BY count DESC;

-- Total acreage and average valuation by type
SELECT 
  type_code,
  SUM(acreage) AS total_acreage,
  AVG(valuation) AS avg_valuation_per_parcel
FROM land_parcel
GROUP BY type_code
ORDER BY total_acreage DESC;
```

## Improvement Table - Structure Valuation

```sql
-- Count of all improvements in the system
SELECT COUNT(*) AS total_improvements FROM improvement;

-- Count of improvements by type
SELECT type_code, COUNT(*) AS count 
FROM improvement 
GROUP BY type_code 
ORDER BY count DESC;

-- Average replacement cost by improvement type and year built (decade)
SELECT 
  type_code,
  (year_built / 10) * 10 AS decade,
  COUNT(*) AS count,
  AVG(replacement_cost) AS avg_replacement_cost
FROM improvement
WHERE year_built IS NOT NULL
GROUP BY type_code, (year_built / 10) * 10
ORDER BY type_code, decade;
```

## Levy Bill Table - Tax Assessment Records

```sql
-- Count of all levy bills in the system
SELECT COUNT(*) AS total_bills FROM levy_bill;

-- Count of bills by status
SELECT status, COUNT(*) AS count 
FROM levy_bill 
GROUP BY status 
ORDER BY count DESC;

-- Sum of billed amounts by status
SELECT 
  status, 
  COUNT(*) AS bill_count,
  SUM(billed_amount) AS total_billed
FROM levy_bill
GROUP BY status
ORDER BY total_billed DESC;
```

## Payment Table - Revenue Collection 

```sql
-- Count of all payments in the system
SELECT COUNT(*) AS total_payments FROM payment;

-- Total payments by month and year
SELECT 
  EXTRACT(YEAR FROM tender_date) AS year,
  EXTRACT(MONTH FROM tender_date) AS month,
  COUNT(*) AS payment_count,
  SUM(amount) AS total_collected
FROM payment
GROUP BY year, month
ORDER BY year, month;
```

## Special Assessment Table - Special Charges

```sql
-- Count of all special assessments in the system
SELECT COUNT(*) AS total_special_assessments FROM special_assessment;

-- Sum of special assessments by agency
SELECT 
  agency_code, 
  COUNT(*) AS assessment_count,
  SUM(assessment_amount) AS total_assessed
FROM special_assessment
GROUP BY agency_code
ORDER BY total_assessed DESC;

-- Assessment timespan distribution
SELECT 
  (end_year - start_year) AS duration_years,
  COUNT(*) AS assessment_count,
  AVG(assessment_amount) AS avg_assessment_amount
FROM special_assessment
WHERE start_year IS NOT NULL AND end_year IS NOT NULL
GROUP BY (end_year - start_year)
ORDER BY duration_years;
```