# TerraFusion Analytics

This dbt (data build tool) project provides a comprehensive analytics layer for the TerraFusion property assessment and taxation system. The project transforms the data from the operational database into a dimensional model suitable for analytics and reporting.

## Project Structure

- `models/`: Contains SQL models organized by folder
  - `staging/`: Models that clean and prepare source data
  - `marts/`: Dimension and fact tables that form the star schema
- `macros/`: Reusable SQL components and utility functions
- `tests/`: Data quality tests
- `profiles.yml`: Database connection configuration

## Dimensional Model

The analytics models are structured as a star schema with the following components:

### Dimension Tables
- `dim_property`: Property attributes and metadata
- `dim_levy`: Tax levy information including rates and districts

### Fact Tables
- `fact_property_valuation`: Property valuations including land and improvements
- `fact_property_tax`: Tax bills, payments, and balances
- `fact_special_assessments`: Special assessments applied to properties

## Getting Started

1. Ensure your database connection is properly configured in `profiles.yml`
2. Run `dbt debug` to verify database connectivity
3. Run `dbt deps` to install dependencies
4. Run `dbt run` to build all models or `dbt run --select <model_name>` for specific models
5. Run `dbt test` to execute data quality tests

## Usage Examples

### Property Valuation Analysis

```sql
select
    extract(year from p.created_at) as assessment_year,
    count(*) as property_count,
    avg(v.total_property_value) as average_property_value,
    sum(v.total_property_value) as total_property_value
from
    analytics.mart.dim_property p
    join analytics.mart.fact_property_valuation v on p.property_id = v.property_id
group by
    extract(year from p.created_at)
order by
    assessment_year;
```

### Tax Collection Status

```sql
select
    l.levy_year,
    l.district_code,
    l.authority_name,
    count(*) as bill_count,
    sum(t.billed_amount) as total_billed,
    sum(t.total_payments) as total_collected,
    sum(t.balance_due) as total_outstanding,
    sum(case when t.is_paid_in_full then 1 else 0 end) as paid_in_full_count,
    sum(case when t.is_past_due then 1 else 0 end) as past_due_count
from
    analytics.mart.dim_levy l
    join analytics.mart.fact_property_tax t on l.levy_id = t.levy_id
group by
    l.levy_year,
    l.district_code,
    l.authority_name
order by
    l.levy_year desc,
    l.district_code;
```

## Data Quality

This project includes data tests to ensure the accuracy and reliability of the analytics models. Tests validate primary keys, foreign key relationships, and business rules. Run `dbt test` to execute all tests.