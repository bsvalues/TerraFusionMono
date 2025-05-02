-- models/marts/dim_property.sql
{{
  config(
    materialized = 'table'
  )
}}

with property as (
    select *
    from {{ ref('stg_property') }}
),

final as (
    select
        property_id,
        created_at,
        updated_at,
        created_by,
        updated_by
    from property
)

select * from final