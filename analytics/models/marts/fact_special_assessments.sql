-- models/marts/fact_special_assessments.sql
{{
  config(
    materialized = 'table'
  )
}}

with property as (
    select *
    from {{ ref('stg_property') }}
),

special_assessment as (
    select *
    from {{ ref('stg_special_assessment') }}
),

current_year as (
    select extract(year from current_date) as year
),

assessment_by_property as (
    select
        s.property_id,
        s.agency_code,
        s.description,
        s.assessment_amount,
        s.start_year,
        s.end_year,
        s.created_at,
        s.updated_at,
        case 
            when cy.year between s.start_year and s.end_year then true
            else false
        end as is_active
    from special_assessment s
    cross join current_year cy
),

final as (
    select
        a.property_id,
        a.agency_code,
        a.description,
        a.assessment_amount,
        a.start_year,
        a.end_year,
        a.is_active,
        a.end_year - a.start_year + 1 as assessment_duration_years,
        a.created_at,
        a.updated_at
    from assessment_by_property a
)

select * from final