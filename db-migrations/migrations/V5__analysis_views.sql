-- V5__analysis_views.sql
-- Create views for common analysis queries

-- Property valuation summary view
CREATE OR REPLACE VIEW billing.property_valuation_summary AS
SELECT 
    p.id AS property_id,
    COALESCE(SUM(l.valuation), 0) AS total_land_value,
    COALESCE(SUM(i.replacement_cost), 0) AS total_improvement_value,
    COALESCE(SUM(l.valuation), 0) + COALESCE(SUM(i.replacement_cost), 0) AS total_property_value,
    COUNT(DISTINCT l.id) AS land_parcel_count,
    COUNT(DISTINCT i.id) AS improvement_count
FROM 
    appraisal.property p
LEFT JOIN 
    appraisal.land_parcel l ON p.id = l.property_id
LEFT JOIN 
    appraisal.improvement i ON p.id = i.property_id
GROUP BY 
    p.id;

-- Billing summary view
CREATE OR REPLACE VIEW billing.property_billing_summary AS
SELECT 
    p.id AS property_id,
    COALESCE(SUM(lb.billed_amount), 0) AS total_billed,
    COALESCE(SUM(pay.amount), 0) AS total_paid,
    COALESCE(SUM(lb.billed_amount), 0) - COALESCE(SUM(pay.amount), 0) AS balance_due,
    COUNT(DISTINCT lb.id) AS bill_count,
    COUNT(DISTINCT pay.id) AS payment_count,
    COALESCE(MAX(pay.tender_date), NULL) AS last_payment_date
FROM 
    appraisal.property p
LEFT JOIN 
    billing.levy_bill lb ON p.id = lb.property_id
LEFT JOIN 
    billing.payment pay ON lb.id = pay.bill_id
GROUP BY 
    p.id;

-- Special assessments summary view
CREATE OR REPLACE VIEW billing.special_assessment_summary AS
SELECT
    p.id AS property_id,
    COUNT(sa.id) AS assessment_count,
    COALESCE(SUM(sa.assessment_amount), 0) AS total_assessment_amount,
    MIN(sa.start_year) AS earliest_assessment_year,
    MAX(sa.end_year) AS latest_assessment_year,
    STRING_AGG(DISTINCT sa.agency_code, ', ') AS agencies
FROM
    appraisal.property p
LEFT JOIN
    billing.special_assessment sa ON p.id = sa.property_id
GROUP BY
    p.id;

-- Property comprehensive view
CREATE OR REPLACE VIEW master.property_comprehensive AS
SELECT
    p.id AS property_id,
    vs.total_land_value,
    vs.total_improvement_value,
    vs.total_property_value,
    vs.land_parcel_count,
    vs.improvement_count,
    bs.total_billed,
    bs.total_paid,
    bs.balance_due,
    bs.bill_count,
    bs.payment_count,
    bs.last_payment_date,
    sa.assessment_count,
    sa.total_assessment_amount,
    sa.earliest_assessment_year,
    sa.latest_assessment_year,
    sa.agencies AS assessment_agencies
FROM
    appraisal.property p
LEFT JOIN
    billing.property_valuation_summary vs ON p.id = vs.property_id
LEFT JOIN
    billing.property_billing_summary bs ON p.id = bs.property_id
LEFT JOIN
    billing.special_assessment_summary sa ON p.id = sa.property_id;