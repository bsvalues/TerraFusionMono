-- models/staging/stg_owner.sql
with source as (
    select
        id,
        first_name,
        last_name,
        address,
        email,
        phone,
        created_at,
        updated_at
    from
        {{ source('master', 'account') }}  -- assuming the account table exists in master schema
)
select
    id as owner_id,
    first_name,
    last_name,
    address,
    email,
    phone,
    created_at,
    updated_at
from source