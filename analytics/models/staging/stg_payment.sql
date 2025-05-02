-- models/staging/stg_payment.sql
with source as (
    select
        id,
        bill_id,
        tender_date,
        amount
    from
        {{ source('billing', 'payment') }}
)
select
    id as payment_id,
    bill_id,
    tender_date,
    amount as payment_amount
from source