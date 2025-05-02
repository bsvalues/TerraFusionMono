-- models/staging/stg_tax_area.sql
with source as (
    select
        id,
        code,
        name,
        description,
        jurisdiction_type,
        effective_date,
        expiration_date,
        created_at,
        updated_at
    from
        {{ source('master', 'tax_area') }}  -- assuming the tax_area table exists in master schema
)
select
    id as tax_area_id,
    code as area_code,
    name as area_name,
    description,
    jurisdiction_type,
    effective_date,
    expiration_date,
    created_at,
    updated_at,
    case
        when current_date between effective_date and coalesce(expiration_date, '9999-12-31'::date) then true
        else false
    end as is_active
from source