-- models/marts/dim_time.sql
{{
  config(
    materialized = 'table'
  )
}}

with time_data as (
    select *
    from {{ ref('stg_time') }}
),

final as (
    select
        date_key,
        year,
        month,
        day,
        month_name,
        month_short,
        quarter,
        quarter_name,
        week_of_year,
        day_of_year,
        day_of_week,
        day_name,
        day_short,
        fiscal_year,
        fiscal_month,
        is_first_day_of_month,
        is_last_day_of_month,
        is_weekend
    from time_data
)

select * from final