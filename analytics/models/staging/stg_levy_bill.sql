-- models/staging/stg_levy_bill.sql
with source as (
    select
        id,
        property_id,
        levy_id,
        billed_amount,
        due_date,
        status,
        created_at,
        updated_at
    from
        {{ source('billing', 'levy_bill') }}
)
select
    id as bill_id,
    property_id,
    levy_id,
    billed_amount,
    due_date,
    status,
    created_at,
    updated_at
from source