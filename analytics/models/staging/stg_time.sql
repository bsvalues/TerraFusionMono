-- models/staging/stg_time.sql
with date_spine as (
    -- Generate a series of dates from 5 years ago to 5 years in the future
    select date_trunc('day', dd)::date as date
    from generate_series(
        date_trunc('year', current_date - interval '5 years'),
        date_trunc('year', current_date + interval '5 years'),
        interval '1 day'
    ) as dd
)
select
    date as date_key,
    extract(year from date) as year,
    extract(month from date) as month,
    extract(day from date) as day,
    to_char(date, 'Month') as month_name,
    to_char(date, 'Mon') as month_short,
    extract(quarter from date) as quarter,
    'Q' || extract(quarter from date) as quarter_name,
    extract(week from date) as week_of_year,
    extract(doy from date) as day_of_year,
    extract(dow from date) as day_of_week,
    to_char(date, 'Day') as day_name,
    to_char(date, 'Dy') as day_short,
    case
        when extract(month from date) >= 7 then extract(year from date) + 1
        else extract(year from date)
    end as fiscal_year,
    case
        when extract(month from date) >= 7 then extract(month from date) - 6
        else extract(month from date) + 6
    end as fiscal_month,
    case
        when date = date_trunc('month', date)::date then true
        else false
    end as is_first_day_of_month,
    case
        when date = (date_trunc('month', date) + interval '1 month' - interval '1 day')::date then true
        else false
    end as is_last_day_of_month,
    case
        when extract(isodow from date) in (6, 7) then true
        else false
    end as is_weekend
from date_spine