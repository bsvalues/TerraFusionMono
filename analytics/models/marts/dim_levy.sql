-- models/marts/dim_levy.sql
{{
  config(
    materialized = 'table'
  )
}}

with levy as (
    select *
    from {{ ref('stg_levy') }}
),

final as (
    select
        levy_id,
        district_code,
        authority_name,
        levy_year,
        tax_rate,
        effective_date,
        created_at,
        updated_at
    from levy
)

select * from final