-- models/marts/fact_property_valuation.sql
{{
  config(
    materialized = 'table'
  )
}}

with property as (
    select *
    from {{ ref('stg_property') }}
),

land_parcel as (
    select *
    from {{ ref('stg_land_parcel') }}
),

improvement as (
    select *
    from {{ ref('stg_improvement') }}
),

property_values as (
    select
        p.property_id,
        sum(l.land_value) as total_land_value,
        sum(i.improvement_value) as total_improvement_value,
        count(distinct l.land_parcel_id) as land_parcel_count,
        count(distinct i.improvement_id) as improvement_count
    from property p
    left join land_parcel l on p.property_id = l.property_id
    left join improvement i on p.property_id = i.property_id
    group by p.property_id
),

final as (
    select
        pv.property_id,
        pv.total_land_value,
        pv.total_improvement_value,
        pv.total_land_value + coalesce(pv.total_improvement_value, 0) as total_property_value,
        pv.land_parcel_count,
        pv.improvement_count,
        p.created_at,
        p.updated_at
    from property_values pv
    join property p on pv.property_id = p.property_id
)

select * from final