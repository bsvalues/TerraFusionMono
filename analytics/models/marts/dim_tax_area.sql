-- models/marts/dim_tax_area.sql
{{
  config(
    materialized = 'table'
  )
}}

with tax_area as (
    select *
    from {{ ref('stg_tax_area') }}
),

final as (
    select
        tax_area_id,
        area_code,
        area_name,
        description,
        jurisdiction_type,
        effective_date,
        expiration_date,
        is_active,
        created_at,
        updated_at
    from tax_area
)

select * from final