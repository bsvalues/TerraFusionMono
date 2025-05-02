-- models/staging/stg_improvement.sql
with source as (
    select
        id,
        property_id,
        type_code,
        year_built,
        replacement_cost,
        created_at,
        updated_at
    from
        {{ source('appraisal', 'improvement') }}
)
select
    id as improvement_id,
    property_id,
    type_code,
    year_built,
    replacement_cost as improvement_value,
    created_at,
    updated_at
from source