Create view __Imp_on_MH_Tax_st as
SELECT[group_id]
      ,[year]
      ,[run_id]
      ,[statement_id]
      ,[copy_type]
      ,[prop_id]
      ,[owner_id]
      ,[sup_num]
      ,[property_type_desc]
      ,[tax_area_code]
      ,[legal_desc]
      ,[situs_display]
      ,[owner_name]
      ,[care_of_name]
      ,[owner_addr_line1]
      ,[owner_addr_line2]
      ,[owner_addr_line3]
      ,[owner_addr_city]
      ,[owner_addr_state]
      ,[owner_addr_zip]
      ,[owner_addr_country]
      ,[owner_addr_is_deliverable]
      ,[owner_addr_is_international]
      ,[mailto_id]
      ,[mailto_name]
      ,[mailto_addr_line1]
      ,[mailto_addr_line2]
      ,[mailto_addr_line3]
      ,[mailto_addr_city]
      ,[mailto_addr_state]
      ,[mailto_addr_zip]
      ,[mailto_addr_country]
      ,[mailto_addr_is_deliverable]
      ,[mailto_addr_is_international]
      ,[message_cd]
      ,[prior_year_taxes_paid]
      ,[prior_year_pi_paid]
      ,[prior_year_value]
      ,[prior_year_tax_rate]
      ,[current_year_value]
      ,[current_year_tax_rate]
      ,[total_taxes_assessments_fees]
     
      ,[mortgage_co_id]
      ,[mortgage_company]
      ,[due_date]
      ,[full_tax_amount]
      ,[full_interest_amount]
      ,[full_penalty_amount]
      ,[full_total_due]
      ,[half_tax_amount]
      ,[half_interest_amount]
      ,[half_penalty_amount]
      ,[half_total_due]
      ,[delinquent_tax_amount]
      ,[delinquent_interest_amount]
      ,[delinquent_penalty_amount]
      ,[delinquent_total_due]
      ,[total_due]
   
  
      ,[comparison_voted_sum_prev_levy_rate]
      ,[comparison_voted_sum_prev_taxes]
      ,[comparison_voted_sum_curr_levy_rate]
      ,[comparison_voted_sum_curr_taxes]
      ,[comparison_voted_overall_pct_change_levy_rate]
      ,[comparison_voted_overall_pct_change_taxes]
      ,[comparison_nonvoted_sum_prev_levy_rate]
      ,[comparison_nonvoted_sum_prev_taxes]
      ,[comparison_nonvoted_sum_curr_levy_rate]
      ,[comparison_nonvoted_sum_curr_taxes]
      ,[comparison_nonvoted_overall_pct_change_levy_rate]
      ,[comparison_nonvoted_overall_pct_change_taxes]
      ,[show_half_pay_line]
      ,[supp_reason]
      ,[geo_id]
      ,[has_snrdsbl_curr]
      ,[has_snrdsbl_prev]
      ,[full_tax_due_date]
      ,[suppress_prior_year_values]
      ,[assmt_tax_amount]
      ,[fee_tax_amount]
      ,[current_year_imprv_taxable]
      ,[current_year_land_taxable]
      ,[current_year_exmpt_type_cd]
      ,[current_year_exmpt_amt]
      ,[autopay_enrolled_status]
      ,[prior_year_imprv_taxable]
      ,[prior_year_land_taxable]
      ,[prior_year_exmpt_amt]
      ,[prior_year_0_tax_amount]
      ,[prior_year_0_interest]
      ,[prior_year_0_penalty]
      ,[prior_year_1_tax_amount]
      ,[prior_year_1_interest]
      ,[prior_year_1_penalty]
      ,[prior_year_delq_tax_amount]
      ,[prior_year_delq_interest]
      ,[prior_year_delq_penalty]
      ,[gross_tax_amount]
   
      ,[exempt_tax_amount]

  FROM [pacs_oltp].[dbo].[wa_tax_statement]
  where year=(select tax_yr from pacs_oltp.dbo.pacs_system)
  and copy_type=0
  and property_type_desc like 'm%'

GO

