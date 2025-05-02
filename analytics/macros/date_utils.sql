{% macro fiscal_year(date_column) %}
    case
        when extract(month from {{ date_column }}) >= 7 then extract(year from {{ date_column }}) + 1
        else extract(year from {{ date_column }})
    end
{% endmacro %}

{% macro is_current_fiscal_year(date_column) %}
    case
        when extract(month from current_date) >= 7 then 
            case 
                when extract(month from {{ date_column }}) >= 7 
                    and extract(year from {{ date_column }}) = extract(year from current_date)
                    or extract(month from {{ date_column }}) < 7 
                    and extract(year from {{ date_column }}) = extract(year from current_date) + 1
                then true
                else false
            end
        else
            case
                when extract(month from {{ date_column }}) >= 7 
                    and extract(year from {{ date_column }}) = extract(year from current_date) - 1
                    or extract(month from {{ date_column }}) < 7 
                    and extract(year from {{ date_column }}) = extract(year from current_date)
                then true
                else false
            end
    end
{% endmacro %}

{% macro is_past_due(due_date, status) %}
    case 
        when {{ status }} = 'paid' then false
        when {{ due_date }} < current_date then true
        else false
    end
{% endmacro %}