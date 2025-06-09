-- models/marts/fact_property_tax.sql
{{
  config(
    materialized = 'table'
  )
}}

with property as (
    select *
    from {{ ref('stg_property') }}
),

levy as (
    select *
    from {{ ref('stg_levy') }}
),

levy_bill as (
    select *
    from {{ ref('stg_levy_bill') }}
),

payment as (
    select *
    from {{ ref('stg_payment') }}
),

bill_payments as (
    select
        b.bill_id,
        b.property_id,
        b.levy_id,
        b.billed_amount,
        b.due_date,
        b.status,
        sum(p.payment_amount) as total_payments,
        count(p.payment_id) as payment_count,
        max(p.tender_date) as last_payment_date
    from levy_bill b
    left join payment p on b.bill_id = p.bill_id
    group by 
        b.bill_id,
        b.property_id,
        b.levy_id,
        b.billed_amount,
        b.due_date,
        b.status
),

final as (
    select
        bp.bill_id,
        bp.property_id,
        bp.levy_id,
        l.levy_year,
        l.district_code,
        l.authority_name,
        l.tax_rate,
        bp.billed_amount,
        bp.total_payments,
        bp.billed_amount - coalesce(bp.total_payments, 0) as balance_due,
        bp.payment_count,
        bp.due_date,
        bp.last_payment_date,
        bp.status,
        case 
            when bp.status = 'paid' then true
            when bp.billed_amount <= coalesce(bp.total_payments, 0) then true
            else false
        end as is_paid_in_full,
        case 
            when bp.due_date < current_date and bp.billed_amount > coalesce(bp.total_payments, 0) then true
            else false
        end as is_past_due,
        l.created_at,
        l.updated_at
    from bill_payments bp
    join levy l on bp.levy_id = l.levy_id
)

select * from final