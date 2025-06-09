-- models/staging/stg_levy.sql
with source as (
    select
        id,
        district_code,
        authority_name,
        levy_year,
        rate,
        effective_date,
        created_at,
        updated_at
    from
        {{ source('billing', 'levy') }}
)
select
    id as levy_id,
    district_code,
    authority_name,
    levy_year,
    rate as tax_rate,
    effective_date,
    created_at,
    updated_at
from source