-- V1__baseline.sql
-- Baseline of existing schema. All tables as currently defined.
-- Flyway baseline

/* See docs/db-schema/ddl.sql for full baseline schema */

-- Create schemas if they don't exist
CREATE SCHEMA IF NOT EXISTS appraisal;
CREATE SCHEMA IF NOT EXISTS billing;
CREATE SCHEMA IF NOT EXISTS master;