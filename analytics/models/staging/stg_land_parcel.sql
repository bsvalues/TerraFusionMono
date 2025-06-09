-- models/staging/stg_land_parcel.sql
with source as (
    select
        id,
        property_id,
        type_code,
        acreage,
        valuation,
        created_at,
        updated_at
    from
        {{ source('appraisal', 'land_parcel') }}
)
select
    id as land_parcel_id,
    property_id,
    type_code,
    acreage,
    valuation as land_value,
    created_at,
    updated_at
from source