-- models/marts/dim_owner.sql
{{
  config(
    materialized = 'table'
  )
}}

with owner as (
    select *
    from {{ ref('stg_owner') }}
),

final as (
    select
        owner_id,
        first_name,
        last_name,
        concat(first_name, ' ', last_name) as full_name,
        address,
        email,
        phone,
        created_at,
        updated_at
    from owner
)

select * from final