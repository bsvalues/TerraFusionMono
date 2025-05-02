-- models/staging/stg_property.sql
with source as (
    select
        id,
        created_at,
        updated_at,
        created_by,
        updated_by
    from
        {{ source('appraisal', 'property') }}
)
select
    id as property_id,
    created_at,
    updated_at,
    created_by,
    updated_by
from source