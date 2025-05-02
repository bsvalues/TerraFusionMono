-- models/staging/stg_special_assessment.sql
with source as (
    select
        id,
        property_id,
        agency_code,
        description,
        assessment_amount,
        start_year,
        end_year,
        created_at,
        updated_at
    from
        {{ source('billing', 'special_assessment') }}
)
select
    id as assessment_id,
    property_id,
    agency_code,
    description,
    assessment_amount,
    start_year,
    end_year,
    created_at,
    updated_at
from source