{% macro calculate_total_value(land_value, improvement_value) %}
    {{ land_value }} + coalesce({{ improvement_value }}, 0)
{% endmacro %}

{% macro calculate_remaining_balance(billed_amount, payments) %}
    {{ billed_amount }} - coalesce({{ payments }}, 0)
{% endmacro %}

{% macro is_paid_in_full(billed_amount, payments, status) %}
    case 
        when {{ status }} = 'paid' then true
        when {{ billed_amount }} <= coalesce({{ payments }}, 0) then true
        else false
    end
{% endmacro %}

{% macro annual_assessment_amount(total_amount, start_year, end_year) %}
    {{ total_amount }} / nullif({{ end_year }} - {{ start_year }} + 1, 0)
{% endmacro %}