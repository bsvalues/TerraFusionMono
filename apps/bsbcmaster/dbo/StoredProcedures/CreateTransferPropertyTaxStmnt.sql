

CREATE   PROCEDURE dbo.CreateTransferPropertyTaxStmnt

@input_stmnt_yr			numeric(4),
@input_sup_num			int,
@input_prop_id			int,
@input_owner_id			int,
@input_event_id			int,
@input_user_id			int

as
declare @orig_owner_id as int
declare @prop_id		int
declare @owner_id		int
declare @sup_num		int
declare @sup_tax_yr		numeric(4)
declare @bill_id		int
declare @bill_m_n_o		numeric(14,2)
declare @bill_i_n_s		numeric(14,2)
declare @bill_m_n_o_pd		numeric(14,2)
declare @bill_i_n_s_pd 		numeric(14,2)
declare @discount_mno_pd 	numeric(14,2)
declare @discount_ins_pd 	numeric(14,2)
declare @coll_status_cd		char(5)
declare @bill_assessed_value	numeric(14)
declare @bill_taxable_val	numeric(14)
declare @entity_id		int
declare @entity_cd		char(5)
declare @entity_name		char(70)
declare @bDiscount		char(1)
declare @entity_prop_pct	numeric(13,10)

declare @effective_dt		varchar(100)
declare @str_penalty_mno_1_amt 	varchar(100)
declare @str_penalty_ins_1_amt 	varchar(100)
declare @str_interest_mno_1_amt 	varchar(100)
declare @str_interest_ins_1_amt 	varchar(100)
declare @str_atty_fee_1_amt	varchar(100)

declare @due_oct		numeric(14,2)
declare @due_nov		numeric(14,2)
declare @due_dec		numeric(14,2)
declare @due_jan		numeric(14,2)
declare @due_feb		numeric(14,2)
declare @due_mar		numeric(14,2)
declare @due_apr		numeric(14,2)
declare @due_may		numeric(14,2)
declare @due_june		numeric(14,2)
declare @due_july		numeric(14,2)

declare @atty_fee		numeric(14,2)

declare @m_n_o_tax_pct		numeric(13,10)
declare @i_n_s_tax_pct		numeric(13,10)
declare @sales_tax_pct		numeric(13,10)

declare @due_pi_oct		numeric(14,2)
declare @due_pi_nov		numeric(14,2)
declare @due_pi_dec		numeric(14,2)
declare @due_pi_jan		numeric(14,2)
declare @due_pi_feb		numeric(14,2)
declare @due_pi_mar		numeric(14,2)
declare @due_pi_apr		numeric(14,2)
declare @due_pi_may		numeric(14,2)
declare @due_pi_june		numeric(14,2)
declare @due_pi_july		numeric(14,2)

declare @entity_1_id			int
declare @entity_1_cd			char(5)
declare @entity_1_name			char(70)
declare @entity_1_taxable		numeric(14)
declare @entity_1_assessed		numeric(14)
declare @entity_1_tax_amt		numeric(14,2)
declare @entity_1_tax_rate 		numeric(13,10)
declare @entity_2_id			int
declare @entity_2_cd			char(5)
declare @entity_2_name			char(70)
declare @entity_2_taxable		numeric(14)
declare @entity_2_assessed		numeric(14)
declare @entity_2_tax_amt		numeric(14,2)
declare @entity_2_tax_rate 		numeric(13,10)
declare @entity_3_id			int
declare @entity_3_cd			char(5)
declare @entity_3_name			char(70)
declare @entity_3_taxable		numeric(14)
declare @entity_3_assessed	 	numeric(14)
declare @entity_3_tax_amt		numeric(14,2)
declare @entity_3_tax_rate 		numeric(13,10)
declare @entity_4_id			int
declare @entity_4_cd			char(5)
declare @entity_4_name			char(70)
declare @entity_4_taxable		numeric(14)
declare @entity_4_assessed		numeric(14)
declare @entity_4_tax_amt		numeric(14,2)
declare @entity_4_tax_rate 		numeric(13,10)
declare @entity_5_id			int
declare @entity_5_cd			char(5)
declare @entity_5_name			char(70)
declare @entity_5_taxable		numeric(14)
declare @entity_5_assessed		numeric(14)
declare @entity_5_tax_amt		numeric(14,2)
declare @entity_5_tax_rate 		numeric(13,10)
declare @entity_6_id			int
declare @entity_6_cd			char(5)
declare @entity_6_name			char(70)
declare @entity_6_taxable		numeric(14)
declare @entity_6_assessed		numeric(14)
declare @entity_6_tax_amt		numeric(14,2)
declare @entity_6_tax_rate 		numeric(13,10)
declare @entity_7_id			int
declare @entity_7_cd			char(5)
declare @entity_7_name			char(70)
declare @entity_7_taxable		numeric(14)
declare @entity_7_assessed		numeric(14)
declare @entity_7_tax_amt		numeric(14,2)
declare @entity_7_tax_rate 		numeric(13,10)
declare @entity_8_id			int
declare @entity_8_cd			char(5)
declare @entity_8_name			char(70)
declare @entity_8_taxable		numeric(14)
declare @entity_8_assessed		numeric(14)
declare @entity_8_tax_amt		numeric(14,2)
declare @entity_8_tax_rate 		numeric(13,10)
declare @entity_9_id			int
declare @entity_9_cd			char(5)
declare @entity_9_name			char(70)
declare @entity_9_taxable		numeric(14)
declare @entity_9_assessed		numeric(14)
declare @entity_9_tax_amt		numeric(14,2)
declare @entity_9_tax_rate 		numeric(13,10)
declare @entity_10_id			int
declare @entity_10_cd			char(5)
declare @entity_10_name			char(70)
declare @entity_10_taxable		numeric(14)
declare @entity_10_assessed		numeric(14)
declare @entity_10_tax_amt		numeric(14,2)
declare @entity_10_tax_rate 		numeric(13,10)

declare @q1_due			numeric(14,2)
declare @q2_due			numeric(14,2)
declare @q3_due			numeric(14,2)
declare @q4_due			numeric(14,2)
declare @q_amt			numeric(14,2)

declare @event_desc		varchar(2048)





declare @temp_pi		numeric(14,2)
declare @amt_paid		numeric(14,2)
declare @curr_year		numeric(4)
declare @prev_stmnt_id		int
declare @prev_prop_id		int
declare @prev_owner_id		int
declare @tax_amount		numeric(14,2)
declare @tax_saved		numeric(14,2)
declare @tax_saved_city		numeric(14,2)
declare @tax_saved_county	numeric(14,2)
declare @entity_type_cd		char(5)
declare @show_freeze 		char(1)


declare @freeze_exmpt_type_cd	char(5)
declare @freeze_yr		numeric(4,0)
declare @freeze_ceiling		numeric(14,2)

declare @statement_id		int

declare @bUseEntity1		int
declare @bUseEntity2		int
declare @bUseEntity3		int
declare @bUseEntity4		int
declare @bUseEntity5		int
declare @bUseEntity6		int
declare @bUseEntity7		int
declare @bUseEntity8		int
declare @bUseEntity9		int
declare @bUseEntity10		int


declare @DueMonth		int
declare @DueDay		int
declare @DueYear		int
declare @DueDate		datetime
declare @date_string		varchar(100)

declare @str_penalty_mno_amt   	varchar(100)
declare @str_penalty_ins_amt  	varchar(100)
declare @str_interest_mno_amt 	varchar(100)
declare @str_interest_ins_amt 	varchar(100)
declare @str_attorney_fee_amt 	varchar(100)
declare @str_base_tax		varchar(100)
declare @str_total		varchar(100)

declare @str_oct_acutal_date	varchar(100)
declare @str_nov_acutal_date	varchar(100)
declare @str_dec_acutal_date	varchar(100)
declare @str_jan_acutal_date	varchar(100)
declare @str_feb_acutal_date	varchar(100)
declare @str_mar_acutal_date	varchar(100)
declare @str_apr_acutal_date	varchar(100)
declare @str_may_acutal_date	varchar(100)
declare @str_june_acutal_date	varchar(100)
declare @str_july_acutal_date    varchar(100)

declare @base_tax_due			numeric(14,2)

declare @entity_1_oct_due		numeric(14,2)
declare @entity_1_nov_due 		numeric(14,2)
declare @entity_1_dec_due		numeric(14,2)
declare @entity_2_oct_due		numeric(14,2)
declare @entity_2_nov_due 		numeric(14,2)
declare @entity_2_dec_due		numeric(14,2)
declare @entity_3_oct_due		numeric(14,2)
declare @entity_3_nov_due 		numeric(14,2)
declare @entity_3_dec_due		numeric(14,2)
declare @entity_4_oct_due		numeric(14,2)
declare @entity_4_nov_due 		numeric(14,2)
declare @entity_4_dec_due		numeric(14,2)
declare @entity_5_oct_due		numeric(14,2)
declare @entity_5_nov_due 		numeric(14,2)
declare @entity_5_dec_due		numeric(14,2)
declare @entity_6_oct_due		numeric(14,2)
declare @entity_6_nov_due 		numeric(14,2)
declare @entity_6_dec_due		numeric(14,2)
declare @entity_7_oct_due		numeric(14,2)
declare @entity_7_nov_due 		numeric(14,2)
declare @entity_7_dec_due		numeric(14,2)
declare @entity_8_oct_due		numeric(14,2)
declare @entity_8_nov_due 		numeric(14,2)
declare @entity_8_dec_due		numeric(14,2)
declare @entity_9_oct_due		numeric(14,2)
declare @entity_9_nov_due 		numeric(14,2)
declare @entity_9_dec_due		numeric(14,2)
declare @entity_10_oct_due		numeric(14,2)
declare @entity_10_nov_due 		numeric(14,2)
declare @entity_10_dec_due		numeric(14,2)
declare @entity_1_jan_due		numeric(14,2)
declare @entity_2_jan_due		numeric(14,2)
declare @entity_3_jan_due		numeric(14,2)
declare @entity_4_jan_due		numeric(14,2)
declare @entity_5_jan_due		numeric(14,2)
declare @entity_6_jan_due		numeric(14,2)
declare @entity_7_jan_due		numeric(14,2)

declare @entity_8_jan_due		numeric(14,2)
declare @entity_9_jan_due		numeric(14,2)
declare @entity_10_jan_due		numeric(14,2)

declare @entity_oct_due			numeric(14,2)
declare @entity_nov_due			numeric(14,2)
declare @entity_dec_due			numeric(14,2)
declare @entity_jan_due			numeric(14,2)

declare @entity_1_discount		char(1)
declare @entity_2_discount		char(1)
declare @entity_3_discount		char(1)
declare @entity_4_discount		char(1)
declare @entity_5_discount		char(1)
declare @entity_6_discount		char(1)
declare @entity_7_discount		char(1)
declare @entity_8_discount		char(1)
declare @entity_9_discount		char(1)
declare @entity_10_discount		char(1)

declare @entity_1_freeze_exmpt_type_cd	char(5)
declare @entity_1_freeze_yr		char(4)
declare @entity_1_freeze_ceiling	varchar(14)
declare @entity_2_freeze_exmpt_type_cd	char(5)
declare @entity_2_freeze_yr		char(4)
declare @entity_2_freeze_ceiling	varchar(14)
declare @entity_3_freeze_exmpt_type_cd	char(5)
declare @entity_3_freeze_yr		char(4)
declare @entity_3_freeze_ceiling	varchar(14)
declare @entity_4_freeze_exmpt_type_cd	char(5)
declare @entity_4_freeze_yr		char(4)
declare @entity_4_freeze_ceiling	varchar(14)
declare @entity_5_freeze_exmpt_type_cd	char(5)
declare @entity_5_freeze_yr		char(4)
declare @entity_5_freeze_ceiling	varchar(14)
declare @entity_6_freeze_exmpt_type_cd	char(5)
declare @entity_6_freeze_yr		char(4)
declare @entity_6_freeze_ceiling	varchar(14)
declare @entity_7_freeze_exmpt_type_cd	char(5)
declare @entity_7_freeze_yr		char(4)
declare @entity_7_freeze_ceiling	varchar(14)
declare @entity_8_freeze_exmpt_type_cd	char(5)
declare @entity_8_freeze_yr		char(4)
declare @entity_8_freeze_ceiling	varchar(14)
declare @entity_9_freeze_exmpt_type_cd	char(5)
declare @entity_9_freeze_yr		char(4)
declare @entity_9_freeze_ceiling	varchar(14)
declare @entity_10_freeze_exmpt_type_cd	char(5)
declare @entity_10_freeze_yr		char(4)
declare @entity_10_freeze_ceiling	varchar(14)

declare @lease_flag bit

declare @delq_tax	char(1)

set @orig_owner_id=@input_owner_id

SELECT @lease_flag = ISNULL(lease_flag, 0)
FROM pacs_system
WHERE system_type IN ('A', 'B')


/* setup the initial due date */
select @DueDate = GetDate()

select @DueMonth = DATEPART(month, @DueDate)
select @DueDay   = DATEPART(day,   @DueDate)
select @DueYear  = DATEPART(year,  @DueDate)

-- month 1
select @DueDay = 0 

exec   GetLastDayOfMonth @DueMonth, @DueYear,  @DueDay output
select @str_oct_acutal_date = convert(varchar(2), @DueMonth)+ '/' + convert(varchar(2),@DueDay) + '/' + convert(varchar(4), @DueYear)

select @DueMonth = @DueMonth + 1

if (@DueMonth > 12)
begin
	select @DueMonth = 1
	select @DueYear  = @DueYear + 1
end

-- month 2
select @DueDay = 0 

exec   GetLastDayOfMonth @DueMonth, @DueYear,  @DueDay output
select @str_nov_acutal_date = convert(varchar(2), @DueMonth)+ '/' + convert(varchar(2),@DueDay) + '/' + convert(varchar(4), @DueYear)

select @DueMonth = @DueMonth + 1

if (@DueMonth > 12)
begin
	select @DueMonth = 1
	select @DueYear  = @DueYear + 1
end


-- month 3
select @DueDay = 0 

exec   GetLastDayOfMonth @DueMonth, @DueYear,  @DueDay output
select @str_dec_acutal_date = convert(varchar(2), @DueMonth)+ '/' + convert(varchar(2),@DueDay) + '/' + convert(varchar(4), @DueYear)

select @DueMonth = @DueMonth + 1

if (@DueMonth > 12)
begin
	select @DueMonth = 1
	select @DueYear  = @DueYear + 1
end



-- month 4
select @DueDay = 0 

exec   GetLastDayOfMonth @DueMonth, @DueYear,  @DueDay output
select @str_jan_acutal_date = convert(varchar(2), @DueMonth)+ '/' + convert(varchar(2),@DueDay) + '/' + convert(varchar(4), @DueYear)

select @DueMonth = @DueMonth + 1

if (@DueMonth > 12)
begin
	select @DueMonth = 1
	select @DueYear  = @DueYear + 1
end



-- month 5
select @DueDay = 0 

exec   GetLastDayOfMonth @DueMonth, @DueYear,  @DueDay output
select @str_feb_acutal_date = convert(varchar(2), @DueMonth)+ '/' + convert(varchar(2),@DueDay) + '/' + convert(varchar(4), @DueYear)

select @DueMonth = @DueMonth + 1

if (@DueMonth > 12)
begin
	select @DueMonth = 1

	select @DueYear  = @DueYear + 1
end



-- month 6
select @DueDay = 0 

exec   GetLastDayOfMonth @DueMonth, @DueYear,  @DueDay output
select @str_mar_acutal_date = convert(varchar(2), @DueMonth)+ '/' + convert(varchar(2),@DueDay) + '/' + convert(varchar(4), @DueYear)

select @DueMonth = @DueMonth + 1

if (@DueMonth > 12)
begin
	select @DueMonth = 1
	select @DueYear  = @DueYear + 1
end



-- month 7
select @DueDay = 0 

exec   GetLastDayOfMonth @DueMonth, @DueYear,  @DueDay output
select @str_apr_acutal_date = convert(varchar(2), @DueMonth)+ '/' + convert(varchar(2),@DueDay) + '/' + convert(varchar(4), @DueYear)

select @DueMonth = @DueMonth + 1

if (@DueMonth > 12)
begin
	select @DueMonth = 1
	select @DueYear  = @DueYear + 1
end



-- month 8
select @DueDay = 0 

exec   GetLastDayOfMonth @DueMonth, @DueYear,  @DueDay output
select @str_may_acutal_date = convert(varchar(2), @DueMonth)+ '/' + convert(varchar(2),@DueDay) + '/' + convert(varchar(4), @DueYear)

select @DueMonth = @DueMonth + 1

if (@DueMonth > 12)
begin
	select @DueMonth = 1
	select @DueYear  = @DueYear + 1
end


-- month 9
select @DueDay = 0 

exec   GetLastDayOfMonth @DueMonth, @DueYear,  @DueDay output
select @str_june_acutal_date = convert(varchar(2), @DueMonth)+ '/' + convert(varchar(2),@DueDay) + '/' + convert(varchar(4), @DueYear)

select @DueMonth = @DueMonth + 1

if (@DueMonth > 12)
begin
	select @DueMonth = 1
	select @DueYear  = @DueYear + 1
end


-- month 10
select @DueDay = 0 

exec   GetLastDayOfMonth @DueMonth, @DueYear,  @DueDay output
select @str_july_acutal_date = convert(varchar(2), @DueMonth)+ '/' + convert(varchar(2),@DueDay) + '/' + convert(varchar(4), @DueYear)

select @DueMonth = @DueMonth + 1

if (@DueMonth > 12)
begin
	select @DueMonth = 1
	select @DueYear  = @DueYear + 1
end

/* end setting dates */


delete from transfer_tax_stmnt 
where 
	levy_group_id = 0
and	levy_group_yr = @input_stmnt_yr
and	levy_run_id = 0
and	prop_id = @input_prop_id
and	sup_tax_yr = @input_stmnt_yr
and	sup_num = @input_sup_num
and 	owner_id = @input_owner_id


insert into transfer_tax_stmnt
(
	levy_group_id,
	levy_group_yr,
	levy_run_id,
	prop_type_cd,
	prop_id,     
	owner_id,    
	sup_num,
	sup_tax_yr, 
	stmnt_id,
	owner_name,
	owner_addr_line1,                                                   
	owner_addr_line2,                                                   
	owner_addr_line3,                                                   
	owner_addr_city,                                          
	owner_addr_state,                                         
	owner_addr_zip,          
	owner_addr_country,
	owner_addr_is_international,
	owner_addr_deliverable,
	mail_to_type,  
	mail_to_id, 
	mail_to_name,
	mail_to_addr_line1,
	mail_to_addr_line2,
	mail_to_addr_line3,
	mail_to_addr_city,
	mail_to_addr_state,
	mail_to_addr_zip,
	mail_to_addr_country,
	mail_to_addr_is_international,
	mail_to_addr_deliverable,
	legal_desc,
	legal_acreage,
	vit_flag,
	primary_situs,
	situs_num,
	situs_street_prefx,
	situs_street,
	situs_street_sufix,
	situs_unit,
	situs_city,
	situs_state,
	situs_zip,
	situs_display,
	imprv_hstd_val,   
	imprv_non_hstd_val, 
	land_hstd_val,    
	land_non_hstd_val, 
	ag_market,        
	ag_use,           
	tim_market,       
	tim_use,          
	ten_percent_cap,  
	assessed_val,     
	appraised_val,
	geo_id,
	mortgage_id, 
	mortgage_desc,
	mortgage_acct,
	entity_1_id,
	entity_1_cd,
	entity_1_name,
	entity_1_tax_rate,
	entity_1_prop_pct,
	entity_1_assessed, 
	entity_1_taxable, 
	entity_1_hs_amt,  
	entity_1_ov65dp_amt, 
	entity_1_other_amt, 
	entity_1_tax_amt ,
	entity_2_id, 
	entity_2_cd ,
	entity_2_name,
	entity_2_tax_rate, 
	entity_2_prop_pct,
	entity_2_assessed, 
	entity_2_taxable, 
	entity_2_hs_amt,  
	entity_2_ov65dp_amt, 
	entity_2_other_amt, 
	entity_2_tax_amt ,
	entity_3_id, 
	entity_3_cd ,
	entity_3_name,
	entity_3_tax_rate, 
	entity_3_prop_pct,
	entity_3_assessed, 
	entity_3_taxable, 
	entity_3_hs_amt,  
	entity_3_ov65dp_amt, 
	entity_3_other_amt, 
	entity_3_tax_amt ,
	entity_4_id, 
	entity_4_cd ,
	entity_4_name,
	entity_4_tax_rate, 
	entity_4_prop_pct,
	entity_4_assessed, 
	entity_4_taxable, 
	entity_4_hs_amt,  
	entity_4_ov65dp_amt, 
	entity_4_other_amt, 
	entity_4_tax_amt, 
	entity_5_id, 
	entity_5_cd ,
	entity_5_name,
	entity_5_tax_rate, 
	entity_5_prop_pct,
	entity_5_assessed, 
	entity_5_taxable, 
	entity_5_hs_amt,  
	entity_5_ov65dp_amt, 
	entity_5_other_amt, 
	entity_5_tax_amt, 
	entity_6_id, entity_6_cd ,
	entity_6_name,
	entity_6_tax_rate, 
	entity_6_prop_pct,
	entity_6_assessed, 
	entity_6_taxable, 
	entity_6_hs_amt,  
	entity_6_ov65dp_amt, 
	entity_6_other_amt, 
	entity_6_tax_amt, 
	entity_7_id, 
	entity_7_cd ,
	entity_7_name,
	entity_7_tax_rate, 
	entity_7_prop_pct,
	entity_7_assessed, 
	entity_7_taxable, 
	entity_7_hs_amt,  
	entity_7_ov65dp_amt, 
	entity_7_other_amt, 
	entity_7_tax_amt, 
	entity_8_id, 
	entity_8_cd ,
	entity_8_name,
	entity_8_tax_rate, 
	entity_8_prop_pct,
	entity_8_assessed, 
	entity_8_taxable, 
	entity_8_hs_amt,  
	entity_8_ov65dp_amt, 
	entity_8_other_amt, 
	entity_8_tax_amt, 
	entity_9_id, 
	entity_9_cd ,
	entity_9_name,
	entity_9_tax_rate, 
	entity_9_prop_pct,
	entity_9_assessed, 
	entity_9_taxable, 
	entity_9_hs_amt,  
	entity_9_ov65dp_amt, 
	entity_9_other_amt, 
	entity_9_tax_amt, 
	entity_10_id, 
	entity_10_cd ,
	entity_10_name,
	entity_10_tax_rate, 
	entity_10_prop_pct,
	entity_10_assessed, 
	entity_10_taxable, 
	entity_10_hs_amt,  
	entity_10_ov65dp_amt, 
	entity_10_other_amt, 
	entity_10_tax_amt,
	agent_copy,
	mortgage_copy,
	pct_ownership,
	agent_id,
	event_id,
	entity_1_oct_due,	
	entity_1_nov_due, 	
	entity_1_dec_due,	
	entity_2_oct_due,	
	entity_2_nov_due, 	
	entity_2_dec_due,	
	entity_3_oct_due,	
	entity_3_nov_due, 	
	entity_3_dec_due,	
	entity_4_oct_due,	
	entity_4_nov_due, 	
	entity_4_dec_due,	
	entity_5_oct_due,	
	entity_5_nov_due, 	
	entity_5_dec_due,	
	entity_6_oct_due,	
	entity_6_nov_due, 	
	entity_6_dec_due,	
	entity_7_oct_due,	
	entity_7_nov_due, 	
	entity_7_dec_due,	
	entity_8_oct_due,	
	entity_8_nov_due, 	
	entity_8_dec_due,	
	entity_9_oct_due,	
	entity_9_nov_due, 	
	entity_9_dec_due,	
	entity_10_oct_due,	
	entity_10_nov_due, 	
	entity_10_dec_due,
	entity_1_discount,
	entity_2_discount,
	entity_3_discount,
	entity_4_discount,
	entity_5_discount,
	entity_6_discount,
	entity_7_discount,
	entity_8_discount,
	entity_9_discount,
	entity_10_discount,
	entity_1_jan_due,
	entity_2_jan_due,
	entity_3_jan_due,
	entity_4_jan_due,
	entity_5_jan_due,
	entity_6_jan_due,
	entity_7_jan_due,
	entity_8_jan_due,
	entity_9_jan_due,
	entity_10_jan_due,
	q1_due,
	q2_due,
	q3_due,
	q4_due,
	taxserver_id,
	taxserver_copy,
	entity_1_freeze_exmpt_type_cd,
	entity_1_freeze_yr,
	entity_1_freeze_ceiling,
	entity_2_freeze_exmpt_type_cd,
	entity_2_freeze_yr,
	entity_2_freeze_ceiling,
	entity_3_freeze_exmpt_type_cd,
	entity_3_freeze_yr,
	entity_3_freeze_ceiling,
	entity_4_freeze_exmpt_type_cd,
	entity_4_freeze_yr,
	entity_4_freeze_ceiling,
	entity_5_freeze_exmpt_type_cd,
	entity_5_freeze_yr,
	entity_5_freeze_ceiling,
	entity_6_freeze_exmpt_type_cd,
	entity_6_freeze_yr,
	entity_6_freeze_ceiling,
	entity_7_freeze_exmpt_type_cd,
	entity_7_freeze_yr,
	entity_7_freeze_ceiling,
	entity_8_freeze_exmpt_type_cd,
	entity_8_freeze_yr,
	entity_8_freeze_ceiling,
	entity_9_freeze_exmpt_type_cd,
	entity_9_freeze_yr,
	entity_9_freeze_ceiling,
	entity_10_freeze_exmpt_type_cd,
	entity_10_freeze_yr,
	entity_10_freeze_ceiling,
	delq_tax
)
select distinct
	0,
	@input_stmnt_yr,
	0,
	prop_type_cd,
	prop_id,     
	owner_id,    
	@input_sup_num,
	@input_stmnt_yr, 
	stmnt_id,     
	file_as_name,
	addr_line1,
	addr_line2,
	addr_line3,
	addr_city,
	addr_state,
	addr_zip,
	country_cd,
	is_international,
	ml_deliverable,
	'O',
	owner_id,
	file_as_name,
	addr_line1,
	addr_line2,
	addr_line3,
	addr_city ,
	addr_state ,
	addr_zip  ,
	country_cd,
	is_international,
	ml_deliverable,
	legal_desc,
	legal_acreage,          
	vit_flag,
	primary_situs,
	situs_num,
	situs_street_prefx,
	situs_street,
	situs_street_sufix,
	situs_unit,
	situs_city,
	situs_state,
	situs_zip,
	situs_display,
	imprv_hstd_val,   
	imprv_non_hstd_val, 
	land_hstd_val,    
	land_non_hstd_val, 
	ag_market,  
	ag_use_val,    
	timber_market, 
	timber_use, 
	ten_percent_cap,       
	assessed_val,     
	appraised_val,
	geo_id,
	0,
	' ',
	' ',
	0,
	' ',
	' ',
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	' ',
	' ',
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	' ',
	' ',
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	' ',
	' ',
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	' ',
	' ',
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	' ',
	' ',
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	' ',
	' ',
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	' ',
	' ',
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	' ',
	' ',
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	' ',
	' ',
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	'F',
	'F',
	pct_ownership,
	0,
	@input_event_id,
	0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
	'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F',
	0,0,0,0,0,0,0,0,0,0, 0, 0, 0, 0, 0, 'F',
	' ', ' ', ' ',
	' ', ' ', ' ',
	' ', ' ', ' ',
	' ', ' ', ' ',
	' ', ' ', ' ',
	' ', ' ', ' ',
	' ', ' ', ' ',
	' ', ' ', ' ',
	' ', ' ', ' ',
	' ', ' ', ' ',
	'F'
from
	transfer_bill_stmnt_vw
where
	sup_tax_yr = @input_stmnt_yr
and	prop_id = @input_prop_id
and	sup_num = @input_sup_num


select
	@statement_id = stmnt_id
from
	transfer_tax_stmnt
where
	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.event_id = @input_event_id

if (@statement_id is null or @statement_id = 0)
begin
	if exists
	(
	select
		* 
	from
		next_statement_id
	where
		statement_yr = @input_stmnt_yr
	)
	begin
		select
			@statement_id = next_statement_id
		from
			next_statement_id
		where
			statement_yr = @input_stmnt_yr
	end
	else
	begin
		select @statement_id = 1
	end

	update next_statement_id
	set
		next_statement_id = @statement_id + 1
	where
		statement_yr = @input_stmnt_yr
end

update bill
set
	discount_offered = 'T'
from
	tax_rate
where
	bill.sup_tax_yr = tax_rate.tax_rate_yr
and	bill.entity_id = tax_rate.entity_id
and	tax_rate.PLUS_1_PENALTY_PCT < 0
and	bill.sup_tax_yr = @input_stmnt_yr
and	bill.sup_tax_yr = @input_stmnt_yr
and	bill.prop_id = @input_prop_id
and	bill.sup_num = @input_sup_num


update bill
set
	discount_offered = 'F'
from
	tax_rate
where
	bill.sup_tax_yr = tax_rate.tax_rate_yr
and	bill.entity_id = tax_rate.entity_id
and	tax_rate.PLUS_1_PENALTY_PCT >= 0
and	bill.sup_tax_yr = @input_stmnt_yr
and	bill.prop_id = @input_prop_id
and	bill.sup_num = @input_sup_num


update bill
set
	stmnt_id = @statement_id
where
	bill.sup_tax_yr = @input_stmnt_yr
and	bill.prop_id = @input_prop_id
and	bill.sup_num = @input_sup_num

-- Get the collections owner_id which we inserted into the transfer_tax_stmnt
select @input_owner_id = col_owner_id from property where prop_id=@input_prop_id

update transfer_tax_stmnt
set
	stmnt_id = @statement_id
where
	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id

update transfer_tax_stmnt
set
	mortgage_id = transfer_stmnt_mortgage_prop_vw.mortgage_company_id,
	mortgage_desc = transfer_stmnt_mortgage_prop_vw.mortgage_company,
	mortgage_acct = transfer_stmnt_mortgage_prop_vw.mortgage_acct_id,
	taxserver_id = transfer_stmnt_mortgage_prop_vw.taxserver_id
from
	transfer_stmnt_mortgage_prop_vw
where
	transfer_stmnt_mortgage_prop_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.stmnt_id = @statement_id
and	transfer_tax_stmnt.event_id = @input_event_id

/* update mineral information */
if @lease_flag = 0
begin
	update transfer_tax_stmnt
	set
		type_of_int = mineral_acct.type_of_int
	from
		mineral_acct
	where
		transfer_tax_stmnt.prop_id = mineral_acct.prop_id
	and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
	and	transfer_tax_stmnt.prop_id = @input_prop_id
	and	transfer_tax_stmnt.sup_num = @input_sup_num
	and	transfer_tax_stmnt.owner_id = @input_owner_id
	and	transfer_tax_stmnt.stmnt_id = @statement_id
	and	transfer_tax_stmnt.event_id = @input_event_id
	
	update transfer_tax_stmnt
	set
		mineral_int_pct = property_val.mineral_int_pct
	from
		property_val
	where
		transfer_tax_stmnt.prop_id = property_val.prop_id
	and	transfer_tax_stmnt.sup_num = property_val.sup_num
	and	transfer_tax_stmnt.sup_tax_yr = property_val.prop_val_yr
	and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
	and	transfer_tax_stmnt.prop_id = @input_prop_id
	and	transfer_tax_stmnt.sup_num = @input_sup_num
	and	transfer_tax_stmnt.owner_id = @input_owner_id
	and	transfer_tax_stmnt.stmnt_id = @statement_id
	and	transfer_tax_stmnt.event_id = @input_event_id
end
else
begin
	update transfer_tax_stmnt
	set
		type_of_int = lpa.interest_type_cd,
		mineral_int_pct = lpa.interest_pct
	from
		lease_prop_assoc as lpa
	where
		transfer_tax_stmnt.prop_id = lpa.prop_id
	and	transfer_tax_stmnt.sup_tax_yr = lpa.lease_yr
	and	transfer_tax_stmnt.sup_num = lpa.sup_num
	and	transfer_tax_stmnt.prop_id = @input_prop_id
	and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
	and	transfer_tax_stmnt.sup_num = @input_sup_num
	and	transfer_tax_stmnt.owner_id = @input_owner_id
	and	transfer_tax_stmnt.stmnt_id = @statement_id
	and	transfer_tax_stmnt.event_id = @input_event_id
	and	lpa.rev_num =
		(
		SELECT
			MAX(rev_num)
		FROM
			lease_prop_assoc
		WHERE
			lpa.prop_id = prop_id
		AND	lpa.lease_id = lease_id
		AND	lpa.lease_yr = lease_yr
		ANd	lpa.sup_num = sup_num
		)
end


update transfer_tax_stmnt
set
	sa_addr_line1 = system_address.addr_line1,
	sa_addr_line2 = system_address.addr_line2,
	sa_addr_line3 = system_address.addr_line3,
	sa_city = system_address.city,
	sa_state = system_address.state,
	sa_zip = system_address.zip,
	sa_phone = system_address.phone_num,
	sa_fax = system_address.fax_num
from
	system_address
where
	system_address.system_type = 'C'
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.stmnt_id = @statement_id
and	transfer_tax_stmnt.event_id = @input_event_id


select @tax_amount    = 0	
select @tax_saved     = 0
select @tax_saved_city = 0
select @tax_saved_county = 0
select @due_oct  = 0

select @due_nov  = 0
select @due_dec  = 0
select @due_jan  = 0
select @due_feb  = 0
select @due_mar  = 0
select @due_apr  = 0
select @due_may  = 0
select @due_june = 0
select @due_july = 0

select @atty_fee = 0

select @due_pi_oct  = 0
select @due_pi_nov  = 0
select @due_pi_dec  = 0
select @due_pi_jan  = 0

select @due_pi_feb  = 0
select @due_pi_mar  = 0
select @due_pi_apr  = 0
select @due_pi_may  = 0
select @due_pi_june = 0
select @due_pi_july = 0

select @bUseEntity1  = 1
select @bUseEntity2  = 1
select @bUseEntity3  = 1
select @bUseEntity4  = 1

select @bUseEntity5  = 1
select @bUseEntity6  = 1
select @bUseEntity7  = 1
select @bUseEntity8  = 1
select @bUseEntity9  = 1
select @bUseEntity10 = 1		

select @entity_1_id       = 0
select @entity_1_cd       = ' '
select @entity_1_name     = ' '
select @entity_1_taxable  = 0
select @entity_1_assessed = 0
select @entity_1_tax_amt  = 0
select @entity_1_tax_rate = 0
select @entity_1_oct_due = 0
select @entity_1_nov_due = 0
select @entity_1_dec_due = 0
select @entity_1_jan_due = 0
select @entity_1_discount = 'F'
select @entity_1_freeze_exmpt_type_cd = ' '
select @entity_1_freeze_yr = ' '
select @entity_1_freeze_ceiling = ' '

select @entity_2_id       = 0
select @entity_2_cd       = ' '
select @entity_2_name     = ' '
select @entity_2_taxable  = 0
select @entity_2_assessed = 0
select @entity_2_tax_amt  = 0
select @entity_2_tax_rate = 0
select @entity_2_oct_due = 0
select @entity_2_nov_due = 0
select @entity_2_dec_due = 0
select @entity_2_jan_due = 0
select @entity_2_discount = 'F'
select @entity_2_freeze_exmpt_type_cd = ' '
select @entity_2_freeze_yr = ' '
select @entity_2_freeze_ceiling = ' '

select @entity_3_id       = 0
select @entity_3_cd       = ' '
select @entity_3_name     = ' '
select @entity_3_taxable  = 0
select @entity_3_assessed = 0
select @entity_3_tax_amt  = 0
select @entity_3_tax_rate = 0
select @entity_3_oct_due = 0
select @entity_3_nov_due = 0
select @entity_3_dec_due = 0
select @entity_3_jan_due = 0
select @entity_3_discount = 'F'
select @entity_3_freeze_exmpt_type_cd = ' '
select @entity_3_freeze_yr = ' '
select @entity_3_freeze_ceiling = ' '

select @entity_4_id       = 0
select @entity_4_cd       = ' '
select @entity_4_name     = ' '
select @entity_4_taxable  = 0
select @entity_4_assessed = 0
select @entity_4_tax_amt  = 0
select @entity_4_tax_rate = 0
select @entity_4_oct_due = 0
select @entity_4_nov_due = 0
select @entity_4_dec_due = 0
select @entity_4_jan_due = 0
select @entity_4_discount = 'F'
select @entity_4_freeze_exmpt_type_cd = ' '
select @entity_4_freeze_yr = ' '
select @entity_4_freeze_ceiling = ' '

select @entity_5_id       = 0
select @entity_5_cd       = ' '
select @entity_5_name     = ' '
select @entity_5_taxable  = 0
select @entity_5_assessed = 0
select @entity_5_tax_amt  = 0
select @entity_5_tax_rate = 0
select @entity_5_oct_due = 0
select @entity_5_nov_due = 0
select @entity_5_dec_due = 0
select @entity_5_jan_due = 0
select @entity_5_discount = 'F'
select @entity_5_freeze_exmpt_type_cd = ' '
select @entity_5_freeze_yr = ' '
select @entity_5_freeze_ceiling = ' '

select @entity_6_id       = 0
select @entity_6_cd       = ' '
select @entity_6_name     = ' '
select @entity_6_taxable  = 0
select @entity_6_assessed = 0
select @entity_6_tax_amt  = 0
select @entity_6_tax_rate = 0
select @entity_6_oct_due = 0
select @entity_6_nov_due = 0
select @entity_6_dec_due = 0
select @entity_6_jan_due = 0
select @entity_6_discount = 'F'
select @entity_6_freeze_exmpt_type_cd = ' '
select @entity_6_freeze_yr = ' '
select @entity_6_freeze_ceiling = ' '

select @entity_7_id       = 0
select @entity_7_cd       = ' '
select @entity_7_name     = ' '
select @entity_7_taxable  = 0
select @entity_7_assessed = 0
select @entity_7_tax_amt  = 0
select @entity_7_tax_rate = 0
select @entity_7_oct_due = 0
select @entity_7_nov_due = 0
select @entity_7_dec_due = 0
select @entity_7_jan_due = 0
select @entity_7_discount = 'F'
select @entity_7_freeze_exmpt_type_cd = ' '
select @entity_7_freeze_yr = ' '
select @entity_7_freeze_ceiling = ' '

select @entity_8_id       = 0
select @entity_8_cd       = ' '
select @entity_8_name     = ' '
select @entity_8_taxable  = 0
select @entity_8_assessed = 0
select @entity_8_tax_amt  = 0
select @entity_8_tax_rate = 0
select @entity_8_oct_due = 0
select @entity_8_nov_due = 0
select @entity_8_dec_due = 0
select @entity_8_jan_due = 0
select @entity_8_discount = 'F'
select @entity_8_freeze_exmpt_type_cd = ' '
select @entity_8_freeze_yr = ' '
select @entity_8_freeze_ceiling = ' '

select @entity_9_id       = 0
select @entity_9_cd       = ' '
select @entity_9_name     = ' '
select @entity_9_taxable  = 0
select @entity_9_assessed = 0
select @entity_9_tax_amt  = 0
select @entity_9_tax_rate = 0
select @entity_9_oct_due = 0
select @entity_9_nov_due = 0
select @entity_9_dec_due = 0
select @entity_9_jan_due = 0
select @entity_9_discount = 'F'
select @entity_9_freeze_exmpt_type_cd = ' '
select @entity_9_freeze_yr = ' '
select @entity_9_freeze_ceiling = ' '

select @entity_10_id   = 0
select @entity_10_cd       = ' '
select @entity_10_name     = ' '
select @entity_10_taxable  = 0
select @entity_10_assessed = 0
select @entity_10_tax_amt  = 0
select @entity_10_tax_rate = 0
select @entity_10_oct_due = 0
select @entity_10_nov_due = 0
select @entity_10_dec_due = 0
select @entity_10_jan_due = 0
select @entity_10_discount = 'F'
select @entity_10_freeze_exmpt_type_cd = ' '
select @entity_10_freeze_yr = ' '
select @entity_10_freeze_ceiling = ' '

select @q1_due = 0
select @q2_due = 0
select @q3_due = 0
select @q4_due = 0

select @show_freeze = 'F'

set @delq_tax = 'F'
		

declare stmnt_info scroll cursor  
for
select
	bill.prop_id,
	bill.owner_id,
	bill.sup_num,
	bill.sup_tax_yr,
	bill.stmnt_id,
	entity_cd,
	file_as_name,
	bill.bill_id,
	bill.entity_id,
	bill.bill_adj_m_n_o,
	bill.bill_adj_i_n_s,
	bill.bill_assessed_value,
	bill.bill_taxable_val,
	bill.discount_offered,
	tax_rate.m_n_o_tax_pct,
	tax_rate.i_n_s_tax_pct,
	tax_rate.sales_tax_pct,
	entity_prop_assoc.entity_prop_pct,
	bill.bill_m_n_o_pd,
	bill.bill_i_n_s_pd,
	bill.discount_mno_pd,
	bill.discount_ins_pd,
	bill.coll_status_cd,
	entity.entity_type_cd
from
	bill,
	account,
	entity,
	tax_rate,
	entity_prop_assoc
where
	bill.prop_id = entity_prop_assoc.prop_id
and	bill.sup_num = entity_prop_assoc.sup_num
and	bill.sup_tax_yr = entity_prop_assoc.tax_yr
and	bill.entity_id = entity_prop_assoc.entity_id
and	bill.entity_id = entity.entity_id
and	bill.entity_id = account.acct_id
and	bill.sup_tax_yr = @input_stmnt_yr
and	bill.prop_id = @input_prop_id
and	bill.sup_num = @input_sup_num
and	bill.stmnt_id = @statement_id
and	bill.sup_tax_yr = tax_rate.tax_rate_yr
and	bill.entity_id = tax_rate.entity_id
and	(
		tax_rate.collect_option = 'CT'
	or	tax_rate.collect_option = 'CSI'
	)
and	bill.coll_status_cd <> 'RS'
and	isnull(entity.rendition_entity, 0) = 0

union

select
	b1.prop_id,
	b1.owner_id,
	b1.sup_num,
	b1.sup_tax_yr,
	b1.stmnt_id,
	'BPP' as entity_cd,
	'Late Renditon Penalty ' as file_as_name,
	0 as bill_id,
	0 as entity_id,
	sum(b1.bill_adj_m_n_o) as bill_adj_m_n_o,
	sum(b1.bill_adj_i_n_s) as bill_adj_i_n_s,
	0 as bill_assessed_value,
	0 as bill_taxable_val,
	'F' as discount_offered,
	0 as m_n_o_tax_pct,
	0 as i_n_s_tax_pct,
	0 as sales_tax_pct,
	0 as entity_prop_pct,
	sum(b1.bill_m_n_o_pd) as bill_m_n_o_pd,
	sum(b1.bill_i_n_s_pd) as bill_i_n_s_pd,
	sum(b1.discount_mno_pd) as discount_mno_pd,
	sum(b1.discount_ins_pd) as discount_ins_pd,
	b1.coll_status_cd,
	'' as entity_type_cd
from
	bill as b1 with (nolock)
inner join
	entity as e with (nolock)
on
	e.entity_id = b1.entity_id
and	e.rendition_entity = 1
inner join
	tax_rate as tr with (nolock)
on
	tr.entity_id = e.entity_id
and	tr.tax_rate_yr = b1.sup_tax_yr
and	tr.collect_option in ('CT', 'CSI')
where
	b1.sup_tax_yr = @input_stmnt_yr
and	b1.prop_id = @input_prop_id
--and	b1.sup_num = @input_sup_num
and	b1.stmnt_id = @statement_id
and	b1.coll_status_cd <> 'RS'
group by
	b1.prop_id,
	b1.owner_id,
	b1.sup_num,
	b1.sup_tax_yr,
	b1.stmnt_id,
	b1.coll_status_cd

order by 
	bill.stmnt_id,
	bill.prop_id,
	bill.owner_id,
	bill.sup_num,
	bill.sup_tax_yr,
	entity_type_cd desc,
	bill.entity_id
  

open stmnt_info
fetch next from stmnt_info
into
	@prop_id,
	@owner_id,

	@sup_num,
	@sup_tax_yr,
	@statement_id,
	@entity_cd,
	@entity_name,
	@bill_id,
	@entity_id,
	@bill_m_n_o,
	@bill_i_n_s,
	@bill_assessed_value,
	@bill_taxable_val,
	@bDiscount,
	@m_n_o_tax_pct,
	@i_n_s_tax_pct,
	@sales_tax_pct,
	@entity_prop_pct,
	@bill_m_n_o_pd,
	@bill_i_n_s_pd,
	@discount_mno_pd,
	@discount_ins_pd,
	@coll_status_cd,
	@entity_type_cd

while (@@fetch_status = 0)
begin
	set @str_base_tax = 0
	set @str_penalty_mno_amt = 0
	set @str_penalty_ins_amt = 0
	set @str_interest_mno_amt = 0
	set @str_interest_ins_amt = 0
	set @str_attorney_fee_amt = 0
	set @str_total = 0
	set @entity_oct_due = 0
	set @entity_nov_due = 0
	set @entity_dec_due = 0
	set @entity_jan_due = 0

	if (@bDiscount is null)
	begin
		select @bDiscount = 'F'

	end


	if (@entity_cd = 'BPP' and @entity_id = 0)
	begin
		exec GetBPPBillTaxDue @prop_id,@sup_num,@sup_tax_yr,@str_oct_acutal_date,@str_base_tax OUTPUT,
				@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
				@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
				@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
	end
	else
	begin


		exec GetBillTaxDue 	@bill_id, 0, 'F', @str_oct_acutal_date, @str_base_tax OUTPUT,
				@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
				@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
				@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
	end



	select @curr_year = @input_stmnt_yr
	select @tax_saved  = @tax_saved + (@bill_taxable_val * @sales_tax_pct/100)
	select @tax_saved  = @tax_saved + (@bill_taxable_val * @sales_tax_pct/100)

	if (@entity_type_cd = 'C')
	begin
		select @tax_saved_city = @tax_saved_city +  (@bill_taxable_val * @sales_tax_pct/100)
	end
	else if (@entity_type_cd = 'G')
	begin
		select @tax_saved_county = @tax_saved_county + (@bill_taxable_val * @sales_tax_pct/100)
	end

	if exists
	(
		select
			*
		from
			entity_exmpt with (nolock)
		where
			entity_id = @entity_id
		and	exmpt_tax_yr = @sup_tax_yr
		and	freeze_flag = 1
	)
	begin
		select @show_freeze = 'T'
	end

	/* set quarterly amounts */
	select @q_amt = (@bill_m_n_o + @bill_i_n_s)/4
	select @q1_due = @q1_due +  @q_amt
	select @q2_due = @q2_due +  @q_amt
	select @q3_due = @q3_due + @q_amt
	select @q4_due = @q4_due + (@bill_m_n_o + @bill_i_n_s) - (@q_amt * 3)
	/* end quarterly amounts */

	
	select @base_tax_due 	= convert(numeric(14,2), @str_base_tax)
	
	if (convert(numeric(14,2), @str_total) > 0)
	begin
		select @coll_status_cd = 'N'
	end
	else
	begin
		select @coll_status_cd = 'P'
	end


	if (@coll_status_cd = 'N' or 
	    @coll_status_cd = 'PP')
	begin
		select @tax_amount = @tax_amount + convert(numeric(14,2), @str_base_tax)
	end
	
	/* october amount */
	if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
	begin
		if (@entity_cd = 'BPP' and @entity_id = 0)
		begin
			exec GetBPPBillTaxDue @prop_id,@sup_num,@sup_tax_yr,@str_oct_acutal_date,@str_base_tax OUTPUT,
					@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
					@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
					@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end
		else
		begin
	
	
			exec GetBillTaxDue 	@bill_id, 0, 'F', @str_oct_acutal_date, @str_base_tax OUTPUT,
					@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
					@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
					@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end

		select @temp_pi = convert(numeric(14,2), @str_penalty_mno_amt) + 
				  convert(numeric(14,2), @str_penalty_ins_amt) + 
				  convert(numeric(14,2), @str_interest_mno_amt) + 
				  convert(numeric(14,2), @str_interest_ins_amt) + 
				  convert(numeric(14,2), @str_attorney_fee_amt) 
	
		select @due_pi_oct = @due_pi_oct + @temp_pi
		select @due_oct = @due_oct + convert(numeric(14,2), @str_total)
		select @entity_oct_due = convert(numeric(14,2), @str_total)
	end
	
	

	/* november amount */
	if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
	begin
		if (@entity_cd = 'BPP' and @entity_id = 0)
		begin
			exec GetBPPBillTaxDue @prop_id,@sup_num,@sup_tax_yr,@str_nov_acutal_date,@str_base_tax OUTPUT,
					@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
					@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
					@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end
		else
		begin
	
	
			exec GetBillTaxDue 	@bill_id, 0, 'F', @str_nov_acutal_date, @str_base_tax OUTPUT,
					@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
					@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
					@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end

		
		select @temp_pi = convert(numeric(14,2), @str_penalty_mno_amt) + 
				  convert(numeric(14,2), @str_penalty_ins_amt) + 
				  convert(numeric(14,2), @str_interest_mno_amt) + 
				  convert(numeric(14,2), @str_interest_ins_amt) + 
				  convert(numeric(14,2), @str_attorney_fee_amt) 
	
		select @due_pi_nov = @due_pi_nov + @temp_pi
		select @due_nov = @due_nov + convert(numeric(14,2), @str_total)
		select @entity_nov_due = convert(numeric(14,2), @str_total)
	end
	
	

	/* december amount */
	if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
	begin
		if (@entity_cd = 'BPP' and @entity_id = 0)
		begin
			exec GetBPPBillTaxDue @prop_id,@sup_num,@sup_tax_yr,@str_dec_acutal_date,@str_base_tax OUTPUT,
				@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
				@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
				@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end
		else
		begin


			exec GetBillTaxDue 	@bill_id, 0, 'F', @str_dec_acutal_date, @str_base_tax OUTPUT,
				@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
				@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
				@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end

		
		select @temp_pi = convert(numeric(14,2), @str_penalty_mno_amt) + 
				  convert(numeric(14,2), @str_penalty_ins_amt) + 
				  convert(numeric(14,2), @str_interest_mno_amt) + 
				  convert(numeric(14,2), @str_interest_ins_amt) + 
				  convert(numeric(14,2), @str_attorney_fee_amt) 
	
		select @due_pi_dec = @due_pi_dec + @temp_pi
		select @due_dec = @due_dec + convert(numeric(14,2), @str_total)
		select @entity_dec_due = convert(numeric(14,2), @str_total)
	end
	




	
	/*january amount */
	if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
	begin
		if (@entity_cd = 'BPP' and @entity_id = 0)
		begin
			exec GetBPPBillTaxDue @prop_id,@sup_num,@sup_tax_yr,@str_jan_acutal_date,@str_base_tax OUTPUT,
					@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
					@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
					@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end
		else
		begin
	
	
			exec GetBillTaxDue 	@bill_id, 0, 'F', @str_jan_acutal_date, @str_base_tax OUTPUT,
					@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
					@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
					@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end

		
		select @temp_pi = convert(numeric(14,2), @str_penalty_mno_amt) + 
				  convert(numeric(14,2), @str_penalty_ins_amt) + 
				  convert(numeric(14,2), @str_interest_mno_amt) + 
				  convert(numeric(14,2), @str_interest_ins_amt) + 
				  convert(numeric(14,2), @str_attorney_fee_amt) 
	
		select @due_pi_jan = @due_pi_jan + @temp_pi
		select @due_jan = @due_jan + convert(numeric(14,2), @str_total)
		select @entity_jan_due = convert(numeric(14,2), @str_total)
						
	end
	

	
	/* february amount */
	if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
	begin
		if (@entity_cd = 'BPP' and @entity_id = 0)
		begin
			exec GetBPPBillTaxDue @prop_id,@sup_num,@sup_tax_yr,@str_feb_acutal_date,@str_base_tax OUTPUT,
					@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
					@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
					@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end
		else
		begin
	
	
			exec GetBillTaxDue 	@bill_id, 0, 'F', @str_feb_acutal_date, @str_base_tax OUTPUT,
					@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
					@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
					@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end

		
		select @temp_pi = convert(numeric(14,2), @str_penalty_mno_amt) + 
				  convert(numeric(14,2), @str_penalty_ins_amt) + 
				  convert(numeric(14,2), @str_interest_mno_amt) + 
				  convert(numeric(14,2), @str_interest_ins_amt) + 
				  convert(numeric(14,2), @str_attorney_fee_amt) 
	
		select @due_pi_feb = @due_pi_feb + @temp_pi
		select @due_feb = @due_feb + convert(numeric(14,2), @str_total)
	end
	

	
	/* march amount */
	if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
	begin
		if (@entity_cd = 'BPP' and @entity_id = 0)
		begin
			exec GetBPPBillTaxDue @prop_id,@sup_num,@sup_tax_yr,@str_mar_acutal_date,@str_base_tax OUTPUT,
					@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
					@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
					@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end
		else
		begin
	
	
			exec GetBillTaxDue 	@bill_id, 0, 'F', @str_mar_acutal_date, @str_base_tax OUTPUT,
					@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
					@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
					@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end

		
		select @temp_pi = convert(numeric(14,2), @str_penalty_mno_amt) + 
				  convert(numeric(14,2), @str_penalty_ins_amt) + 
				  convert(numeric(14,2), @str_interest_mno_amt) + 
				  convert(numeric(14,2), @str_interest_ins_amt) + 
				  convert(numeric(14,2), @str_attorney_fee_amt) 
	
		select @due_pi_mar = @due_pi_mar + @temp_pi
		select @due_mar = @due_mar + convert(numeric(14,2), @str_total)
	end
	
	/* april amount */
	if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
	begin
		if (@entity_cd = 'BPP' and @entity_id = 0)
		begin
			exec GetBPPBillTaxDue @prop_id,@sup_num,@sup_tax_yr,@str_apr_acutal_date,@str_base_tax OUTPUT,
					@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
					@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
					@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end
		else
		begin
	
	
			exec GetBillTaxDue 	@bill_id, 0, 'F', @str_apr_acutal_date, @str_base_tax OUTPUT,
					@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
					@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
					@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end

		
		select @temp_pi = convert(numeric(14,2), @str_penalty_mno_amt) + 
				  convert(numeric(14,2), @str_penalty_ins_amt) + 
				  convert(numeric(14,2), @str_interest_mno_amt) + 
				  convert(numeric(14,2), @str_interest_ins_amt) + 
				  convert(numeric(14,2), @str_attorney_fee_amt) 
	
		select @due_pi_apr = @due_pi_apr + @temp_pi
		select @due_apr = @due_apr + convert(numeric(14,2), @str_total)
	end
	
	/* may amount */
	if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
	begin
		if (@entity_cd = 'BPP' and @entity_id = 0)
		begin
			exec GetBPPBillTaxDue @prop_id,@sup_num,@sup_tax_yr,@str_may_acutal_date,@str_base_tax OUTPUT,
					@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
					@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
					@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end
		else
		begin
	
	
			exec GetBillTaxDue 	@bill_id, 0, 'F', @str_may_acutal_date, @str_base_tax OUTPUT,
					@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
					@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
					@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end

		
		select @temp_pi = convert(numeric(14,2), @str_penalty_mno_amt) + 
				  convert(numeric(14,2), @str_penalty_ins_amt) + 
				  convert(numeric(14,2), @str_interest_mno_amt) + 
				  convert(numeric(14,2), @str_interest_ins_amt) + 
				  convert(numeric(14,2), @str_attorney_fee_amt) 
	
		select @due_pi_may = @due_pi_may + @temp_pi
		select @due_may = @due_may + convert(numeric(14,2), @str_total)
	end
	
	
	/* june amount */
	if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
	begin
		if (@entity_cd = 'BPP' and @entity_id = 0)
		begin
			exec GetBPPBillTaxDue @prop_id,@sup_num,@sup_tax_yr,@str_june_acutal_date,@str_base_tax OUTPUT,
					@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
					@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
					@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end
		else
		begin
	
	
			exec GetBillTaxDue 	@bill_id, 0, 'F', @str_june_acutal_date, @str_base_tax OUTPUT,
					@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
					@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
					@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end

		select @temp_pi = convert(numeric(14,2), @str_penalty_mno_amt) + 
				  convert(numeric(14,2), @str_penalty_ins_amt) + 
				  convert(numeric(14,2), @str_interest_mno_amt) + 
				  convert(numeric(14,2), @str_interest_ins_amt) + 
				  convert(numeric(14,2), @str_attorney_fee_amt) 
	
		select @due_pi_june = @due_pi_june + @temp_pi
		select @due_june = @due_june + convert(numeric(14,2), @str_total)
	end
	
	
	/* july amount */
	if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
	begin
		if (@entity_cd = 'BPP' and @entity_id = 0)
		begin
			exec GetBPPBillTaxDue @prop_id,@sup_num,@sup_tax_yr,@str_july_acutal_date,@str_base_tax OUTPUT,
					@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
					@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
					@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end
		else
		begin
	
	
			exec GetBillTaxDue 	@bill_id, 0, 'F', @str_july_acutal_date, @str_base_tax OUTPUT,
					@str_penalty_mno_amt  OUTPUT, @str_penalty_ins_amt  OUTPUT, 
					@str_interest_mno_amt OUTPUT, @str_interest_ins_amt OUTPUT,
					@str_attorney_fee_amt OUTPUT, @str_total OUTPUT
		end

		
		select @temp_pi = convert(numeric(14,2), @str_penalty_mno_amt) + 
				  convert(numeric(14,2), @str_penalty_ins_amt) + 
				  convert(numeric(14,2), @str_interest_mno_amt) + 
				  convert(numeric(14,2), @str_interest_ins_amt) + 
				  convert(numeric(14,2), @str_attorney_fee_amt) 
	
		select @due_pi_july = @due_pi_july + @temp_pi
		select @due_july = @due_july + convert(numeric(14,2), @str_total)
	end
	



	if (@bUseEntity1 = 1)
	begin
		select @entity_1_id = @entity_id
		select @entity_1_cd = @entity_cd
		select @entity_1_name = @entity_name
		select @entity_1_taxable = @bill_taxable_val
		select @entity_1_assessed = @bill_assessed_value

		if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
		begin
			select @entity_1_tax_amt  = convert(numeric(14,2), @str_base_tax)
		end
		else
		begin
			select @entity_1_tax_amt = 0
		end

		select @entity_1_tax_rate = @m_n_o_tax_pct + @i_n_s_tax_pct
		select @entity_1_oct_due = @entity_oct_due
		select @entity_1_nov_due = @entity_nov_due
		select @entity_1_dec_due = @entity_dec_due
		select @entity_1_jan_due = @entity_jan_due
		select @entity_1_discount = @bDiscount		
		select @bUseEntity1 = 0
	end
	else if (@bUseEntity2 = 1)
	begin
		select @entity_2_id = @entity_id
		select @entity_2_cd = @entity_cd
		select @entity_2_name = @entity_name
		select @entity_2_taxable = @bill_taxable_val
		select @entity_2_assessed = @bill_assessed_value

		if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
		begin
			select @entity_2_tax_amt  = convert(numeric(14,2), @str_base_tax)
		end
		else
		begin
			select @entity_2_tax_amt = 0
		end

		select @entity_2_tax_rate = @m_n_o_tax_pct + @i_n_s_tax_pct	
		select @entity_2_oct_due = @entity_oct_due
		select @entity_2_nov_due = @entity_nov_due
		select @entity_2_dec_due = @entity_dec_due
		select @entity_2_jan_due = @entity_jan_due
		select @entity_2_discount = @bDiscount		
		select @bUseEntity2 = 0
	end
	else if (@bUseEntity3 = 1)
	begin
		select @entity_3_id = @entity_id
		select @entity_3_cd = @entity_cd
		select @entity_3_name = @entity_name
		select @entity_3_taxable = @bill_taxable_val
		select @entity_3_assessed = @bill_assessed_value

		if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
		begin
			select @entity_3_tax_amt  = convert(numeric(14,2), @str_base_tax)
		end
		else
		begin
			select @entity_3_tax_amt = 0
		end

		select @entity_3_tax_rate = @m_n_o_tax_pct + @i_n_s_tax_pct
		select @entity_3_oct_due = @entity_oct_due
		select @entity_3_nov_due = @entity_nov_due
		select @entity_3_dec_due = @entity_dec_due
		select @entity_3_jan_due = @entity_jan_due
		select @entity_3_discount  = @bDiscount		
		select @bUseEntity3 = 0
	end
	else if (@bUseEntity4 = 1)
	begin
		select @entity_4_id = @entity_id
		select @entity_4_cd = @entity_cd
		select @entity_4_name = @entity_name
		select @entity_4_taxable = @bill_taxable_val
		select @entity_4_assessed = @bill_assessed_value

		if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
		begin
			select @entity_4_tax_amt  = convert(numeric(14,2), @str_base_tax)
		end
		else
		begin
			select @entity_4_tax_amt = 0
		end

		select @entity_4_tax_rate = @m_n_o_tax_pct + @i_n_s_tax_pct
		select @entity_4_oct_due = @entity_oct_due
		select @entity_4_nov_due = @entity_nov_due
		select @entity_4_dec_due = @entity_dec_due
		select @entity_4_jan_due = @entity_jan_due
		select @entity_4_discount = @bDiscount		
		select @bUseEntity4 = 0
	end
	else if (@bUseEntity5 = 1)
	begin
		select @entity_5_id = @entity_id
		select @entity_5_cd = @entity_cd
		select @entity_5_name = @entity_name
		select @entity_5_taxable = @bill_taxable_val
		select @entity_5_assessed = @bill_assessed_value

		if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
		begin
			select @entity_5_tax_amt  = convert(numeric(14,2), @str_base_tax)
		end
		else
		begin
			select @entity_5_tax_amt = 0
		end

		select @entity_5_tax_rate = @m_n_o_tax_pct + @i_n_s_tax_pct
		select @entity_5_oct_due = @entity_oct_due
		select @entity_5_nov_due = @entity_nov_due
		select @entity_5_dec_due = @entity_dec_due
		select @entity_5_jan_due = @entity_jan_due
		select @entity_5_discount = @bDiscount		
		select @bUseEntity5 = 0
	end 
	else if (@bUseEntity6 = 1)
	begin
		select @entity_6_id = @entity_id
		select @entity_6_cd = @entity_cd
		select @entity_6_name = @entity_name
		select @entity_6_taxable = @bill_taxable_val
		select @entity_6_assessed = @bill_assessed_value

		if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
		begin
			select @entity_6_tax_amt  = convert(numeric(14,2), @str_base_tax)
		end
		else
		begin
			select @entity_6_tax_amt = 0
		end

		select @entity_6_tax_rate = @m_n_o_tax_pct + @i_n_s_tax_pct
		select @entity_6_oct_due = @entity_oct_due
		select @entity_6_nov_due = @entity_nov_due
		select @entity_6_dec_due = @entity_dec_due
		select @entity_6_jan_due = @entity_jan_due
		select @entity_6_discount = @bDiscount		
		select @bUseEntity6 = 0
	end 
	else if (@bUseEntity7 = 1)
	begin
		select @entity_7_id = @entity_id
		select @entity_7_cd = @entity_cd
		select @entity_7_name = @entity_name
		select @entity_7_taxable = @bill_taxable_val
		select @entity_7_assessed = @bill_assessed_value

		if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
		begin
			select @entity_7_tax_amt  = convert(numeric(14,2), @str_base_tax)
		end
		else
		begin
			select @entity_7_tax_amt = 0
		end

		select @entity_7_tax_rate = @m_n_o_tax_pct + @i_n_s_tax_pct
		select @entity_7_oct_due = @entity_oct_due
		select @entity_7_nov_due = @entity_nov_due
		select @entity_7_dec_due = @entity_dec_due
		select @entity_7_jan_due = @entity_jan_due
		select @entity_7_discount = @bDiscount		
		select @bUseEntity7 = 0
	end 
	else if (@bUseEntity8 = 1)
	begin
		select @entity_8_id = @entity_id
		select @entity_8_cd = @entity_cd
		select @entity_8_name = @entity_name
		select @entity_8_taxable = @bill_taxable_val
		select @entity_8_assessed = @bill_assessed_value

		if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
		begin
			select @entity_8_tax_amt  = convert(numeric(14,2), @str_base_tax)
		end 
		else
		begin
			select @entity_8_tax_amt = 0
		end

		select @entity_8_tax_rate = @m_n_o_tax_pct + @i_n_s_tax_pct
		select @entity_8_oct_due = @entity_oct_due
		select @entity_8_nov_due = @entity_nov_due
		select @entity_8_dec_due = @entity_dec_due
		select @entity_8_jan_due = @entity_jan_due
		select @entity_8_discount = @bDiscount		
		select @bUseEntity8 = 0
	end 
	else if (@bUseEntity9 = 1)
	begin
		select @entity_9_id = @entity_id
		select @entity_9_cd = @entity_cd
		select @entity_9_name = @entity_name
		select @entity_9_taxable = @bill_taxable_val
		select @entity_9_assessed = @bill_assessed_value

		if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
		begin
			select @entity_9_tax_amt  = convert(numeric(14,2), @str_base_tax)
		end
		else
		begin
			select @entity_9_tax_amt = 0
		end

		select @entity_9_tax_rate = @m_n_o_tax_pct + @i_n_s_tax_pct
		select @entity_9_oct_due = @entity_oct_due
		select @entity_9_nov_due = @entity_nov_due
		select @entity_9_dec_due = @entity_dec_due
		select @entity_9_jan_due = @entity_jan_due
		select @entity_9_discount = @bDiscount		
		select @bUseEntity9 = 0
	end 
	else if (@bUseEntity10 = 1)
	begin
		select @entity_10_id = @entity_id
		select @entity_10_cd = @entity_cd
		select @entity_10_name = @entity_name
		select @entity_10_taxable = @bill_taxable_val
		select @entity_10_assessed = @bill_assessed_value

		if (@coll_status_cd = 'N' or @coll_status_cd = 'PP')
		begin
			select @entity_10_tax_amt  = convert(numeric(14,2), @str_base_tax)
		end
		else
		begin
			select @entity_10_tax_amt = 0
		end

		select @entity_10_tax_rate = @m_n_o_tax_pct + @i_n_s_tax_pct
		select @entity_10_oct_due = @entity_oct_due
		select @entity_10_nov_due = @entity_nov_due
		select @entity_10_dec_due = @entity_dec_due
		select @entity_10_jan_due = @entity_jan_due
		select @entity_10_discount = @bDiscount		
		select @bUseEntity10 = 0
	end 

	if exists (select *
		from bill
		where prop_id = @prop_id
		and   sup_tax_yr < @sup_tax_yr  
		and (bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
		((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
		(bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd)
		) > 0
		and coll_status_cd <> 'RS'
		and IsNull(active_bill, 'F') = 'T')
	begin
		set @delq_tax = 'T'
	end
	else
	begin
		set @delq_tax = 'F'
	end
	
	



	fetch next from stmnt_info
	into
		@prop_id,
		@owner_id,
		@sup_num,
		@sup_tax_yr,
		@statement_id,
		@entity_cd,
		@entity_name,
		@bill_id,
		@entity_id,
		@bill_m_n_o,
		@bill_i_n_s,
		@bill_assessed_value,
		@bill_taxable_val,
		@bDiscount,
		@m_n_o_tax_pct,
		@i_n_s_tax_pct,
		@sales_tax_pct,
		@entity_prop_pct,
		@bill_m_n_o_pd,
		@bill_i_n_s_pd,
		@discount_mno_pd,
		@discount_ins_pd,
		@coll_status_cd,
		@entity_type_cd
end

update transfer_tax_stmnt
set
	total_taxes_due = @tax_amount,
	oct_tax_due = @due_oct,
	oct_pi_due = @due_pi_oct,
	nov_tax_due = @due_nov,
	nov_pi_due = @due_pi_nov,
	dec_tax_due = @due_dec,
	dec_pi_due = @due_pi_dec,
	jan_tax_due = @due_jan,
	jan_pi_due = @due_pi_jan,
	feb_tax_due = @due_feb,
	feb_pi_due = @due_pi_feb,
	mar_tax_due = @due_mar,
	mar_pi_due = @due_pi_mar,
	apr_tax_due = @due_apr,
	apr_pi_due = @due_pi_apr,
	may_tax_due = @due_may,
	may_pi_due = @due_pi_may,
	june_tax_due = @due_june,
	june_pi_due = @due_pi_june,
	july_tax_due = @due_july,	
	july_pi_due = @due_pi_july,
	taxes_saved = @tax_saved,
	entity_1_id = @entity_1_id,
	entity_1_cd = @entity_1_cd,
	entity_1_name = @entity_1_name,
	entity_1_taxable = @entity_1_taxable,
	entity_1_assessed = @entity_1_assessed,
	entity_1_tax_amt = @entity_1_tax_amt,
	entity_1_tax_rate = @entity_1_tax_rate,
	entity_2_id = @entity_2_id,
	entity_2_cd = @entity_2_cd,
	entity_2_name = @entity_2_name,
	entity_2_taxable = @entity_2_taxable,
	entity_2_assessed = @entity_2_assessed,
	entity_2_tax_amt = @entity_2_tax_amt,
	entity_2_tax_rate = @entity_2_tax_rate,
	entity_3_id = @entity_3_id,
	entity_3_cd = @entity_3_cd,
	entity_3_name = @entity_3_name,
	entity_3_taxable = @entity_3_taxable,
	entity_3_assessed = @entity_3_assessed,
	entity_3_tax_amt = @entity_3_tax_amt,
	entity_3_tax_rate = @entity_3_tax_rate,
	entity_4_id = @entity_4_id,
	entity_4_cd = @entity_4_cd,
	entity_4_name = @entity_4_name,
	entity_4_taxable = @entity_4_taxable,
	entity_4_assessed = @entity_4_assessed,
	entity_4_tax_amt = @entity_4_tax_amt,
	entity_4_tax_rate = @entity_4_tax_rate,
	entity_5_id = @entity_5_id,
	entity_5_cd = @entity_5_cd,
	entity_5_name = @entity_5_name,
	entity_5_taxable = @entity_5_taxable,
	entity_5_assessed = @entity_5_assessed,
	entity_5_tax_amt = @entity_5_tax_amt,
	entity_5_tax_rate = @entity_5_tax_rate,
	entity_6_id = @entity_6_id,
	entity_6_cd = @entity_6_cd,
	entity_6_name = @entity_6_name,
	entity_6_taxable = @entity_6_taxable,
	entity_6_assessed = @entity_6_assessed,
	entity_6_tax_amt = @entity_6_tax_amt,
	entity_6_tax_rate = @entity_6_tax_rate,
	entity_7_id = @entity_7_id,
	entity_7_cd = @entity_7_cd,
	entity_7_name = @entity_7_name,
	entity_7_taxable = @entity_7_taxable,
	entity_7_assessed = @entity_7_assessed,
	entity_7_tax_amt = @entity_7_tax_amt,
	entity_7_tax_rate = @entity_7_tax_rate,
	entity_8_id = @entity_8_id,
	entity_8_cd = @entity_8_cd,
	entity_8_name = @entity_8_name,
	entity_8_taxable = @entity_8_taxable,
	entity_8_assessed = @entity_8_assessed,
	entity_8_tax_amt = @entity_8_tax_amt,
	entity_8_tax_rate = @entity_8_tax_rate,
	entity_9_id = @entity_9_id,
	entity_9_cd = @entity_9_cd,
	entity_9_name = @entity_9_name,
	entity_9_taxable = @entity_9_taxable,
	entity_9_assessed = @entity_9_assessed,
	entity_9_tax_amt = @entity_9_tax_amt,
	entity_9_tax_rate = @entity_9_tax_rate,
	entity_10_id = @entity_10_id,
	entity_10_cd = @entity_10_cd,
	entity_10_name = @entity_10_name,
	entity_10_taxable = @entity_10_taxable,
	entity_10_assessed = @entity_10_assessed,
	entity_10_tax_amt = @entity_10_tax_amt,
	entity_10_tax_rate = @entity_10_tax_rate,
	oct_actual_date = convert(datetime, @str_oct_acutal_date),
	nov_actual_date = convert(datetime, @str_nov_acutal_date),
	dec_actual_date = convert(datetime, @str_dec_acutal_date),
	jan_actual_date = convert(datetime, @str_jan_acutal_date),
	feb_actual_date = convert(datetime, @str_feb_acutal_date),
	mar_actual_date = convert(datetime, @str_mar_acutal_date),
	apr_actual_date = convert(datetime, @str_apr_acutal_date),
	may_actual_date = convert(datetime, @str_may_acutal_date),
	june_actual_date = convert(datetime, @str_june_acutal_date),
	july_actual_date = convert(datetime, @str_july_acutal_date),
	entity_1_oct_due = @entity_1_oct_due,
	entity_1_nov_due = @entity_1_nov_due,
	entity_1_dec_due = @entity_1_dec_due,
	entity_2_oct_due = @entity_2_oct_due,
	entity_2_nov_due = @entity_2_nov_due,
	entity_2_dec_due = @entity_2_dec_due,
	entity_3_oct_due = @entity_3_oct_due,
	entity_3_nov_due = @entity_3_nov_due,
	entity_3_dec_due = @entity_3_dec_due,
	entity_4_oct_due = @entity_4_oct_due,
	entity_4_nov_due = @entity_4_nov_due,
	entity_4_dec_due = @entity_4_dec_due,
	entity_5_oct_due = @entity_5_oct_due,
	entity_5_nov_due = @entity_5_nov_due,
	entity_5_dec_due = @entity_5_dec_due,
	entity_6_oct_due = @entity_6_oct_due,
	entity_6_nov_due = @entity_6_nov_due,
	entity_6_dec_due = @entity_6_dec_due,
	entity_7_oct_due = @entity_7_oct_due,
	entity_7_nov_due = @entity_7_nov_due,
	entity_7_dec_due = @entity_7_dec_due,
	entity_8_oct_due = @entity_8_oct_due,
	entity_8_nov_due = @entity_8_nov_due,
	entity_8_dec_due = @entity_8_dec_due,
	entity_9_oct_due = @entity_9_oct_due,
	entity_9_nov_due = @entity_9_nov_due,
	entity_9_dec_due = @entity_9_dec_due,
	entity_10_oct_due = @entity_10_oct_due,
	entity_10_nov_due = @entity_10_nov_due,
	entity_10_dec_due = @entity_10_dec_due,
	tax_saved_city = @tax_saved_city,
	tax_saved_county = @tax_saved_county,
	entity_1_discount = @entity_1_discount,
	entity_2_discount = @entity_2_discount,
	entity_3_discount = @entity_3_discount,
	entity_4_discount = @entity_4_discount,
	entity_5_discount = @entity_5_discount,
	entity_6_discount = @entity_6_discount,
	entity_7_discount = @entity_7_discount,
	entity_8_discount = @entity_8_discount,
	entity_9_discount = @entity_9_discount,
	entity_10_discount = @entity_10_discount,
	entity_1_jan_due = @entity_1_jan_due,
	entity_2_jan_due = @entity_2_jan_due,
	entity_3_jan_due = @entity_3_jan_due,
	entity_4_jan_due = @entity_4_jan_due,
	entity_5_jan_due = @entity_5_jan_due,
	entity_6_jan_due = @entity_6_jan_due,	
	entity_7_jan_due = @entity_7_jan_due,
	entity_8_jan_due = @entity_8_jan_due,
	entity_9_jan_due = @entity_9_jan_due,
	entity_10_jan_due = @entity_10_jan_due,
	q1_due = @q1_due,
	q2_due = @q2_due,
	q3_due = @q3_due,
	q4_due = @q4_due,
	show_freeze = @show_freeze,
	delq_tax = @delq_tax
where
	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id
		

close stmnt_info
deallocate stmnt_info         


/* update the entity 1 exemption information */
update transfer_tax_stmnt 
set
	entity_1_hs_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_hs_vw
where
	transfer_stmnt_entity_exmpt_hs_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_hs_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_hs_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_hs_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and  	transfer_stmnt_entity_exmpt_hs_vw.entity_id = transfer_tax_stmnt.entity_1_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id
		

update transfer_tax_stmnt 
set
	entity_1_ov65dp_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_ov65_vw
where
	transfer_stmnt_entity_exmpt_ov65_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_ov65_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_ov65_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_ov65_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_ov65_vw.entity_id = transfer_tax_stmnt.entity_1_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
		

update transfer_tax_stmnt 
set
	entity_1_other_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_other_vw
where
	transfer_stmnt_entity_exmpt_other_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_other_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_other_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_other_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_other_vw.entity_id = transfer_tax_stmnt.entity_1_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id
		




/* update the entity 2 exemption information */
update transfer_tax_stmnt 
set
	entity_2_hs_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_hs_vw
where
	transfer_stmnt_entity_exmpt_hs_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_hs_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_hs_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_hs_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_hs_vw.entity_id = transfer_tax_stmnt.entity_2_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id

update transfer_tax_stmnt 
set
	entity_2_ov65dp_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_ov65_vw
where
	transfer_stmnt_entity_exmpt_ov65_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_ov65_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_ov65_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_ov65_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_ov65_vw.entity_id = transfer_tax_stmnt.entity_2_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id
		

update transfer_tax_stmnt 
set   entity_2_other_amt    = exmpt_amt
from  transfer_stmnt_entity_exmpt_other_vw
where transfer_stmnt_entity_exmpt_other_vw.prop_id      = transfer_tax_stmnt.prop_id
and   transfer_stmnt_entity_exmpt_other_vw.owner_id     = transfer_tax_stmnt.owner_id
and   transfer_stmnt_entity_exmpt_other_vw.sup_num      = transfer_tax_stmnt.sup_num
and   transfer_stmnt_entity_exmpt_other_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and   transfer_stmnt_entity_exmpt_other_vw.entity_id    = transfer_tax_stmnt.entity_2_id
and   transfer_tax_stmnt.stmnt_id   = @statement_id	
and   transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and   transfer_tax_stmnt.prop_id    = @input_prop_id
and   transfer_tax_stmnt.sup_num    = @input_sup_num
and   transfer_tax_stmnt.owner_id   = @input_owner_id
and   transfer_tax_stmnt.event_id   = @input_event_id
		
 

/* update the entity 3 exemption information */
update transfer_tax_stmnt 
set
	entity_3_hs_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_hs_vw
where
	transfer_stmnt_entity_exmpt_hs_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_hs_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_hs_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_hs_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_hs_vw.entity_id = transfer_tax_stmnt.entity_3_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id


update transfer_tax_stmnt 
set
	entity_3_ov65dp_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_ov65_vw
where
	transfer_stmnt_entity_exmpt_ov65_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_ov65_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_ov65_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_ov65_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_ov65_vw.entity_id = transfer_tax_stmnt.entity_3_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id
		

update transfer_tax_stmnt 
set
	entity_3_other_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_other_vw
where
	transfer_stmnt_entity_exmpt_other_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_other_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_other_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_other_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_other_vw.entity_id = transfer_tax_stmnt.entity_3_id 
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id




/* update the entity 4 exemption information */

update transfer_tax_stmnt 
set
	entity_4_hs_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_hs_vw
where
	transfer_stmnt_entity_exmpt_hs_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_hs_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_hs_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_hs_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_hs_vw.entity_id = transfer_tax_stmnt.entity_4_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id

update transfer_tax_stmnt 
set
	entity_4_ov65dp_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_ov65_vw
where
	transfer_stmnt_entity_exmpt_ov65_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_ov65_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_ov65_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_ov65_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_ov65_vw.entity_id = transfer_tax_stmnt.entity_4_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id

update transfer_tax_stmnt 
set
	entity_4_other_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_other_vw
where
	transfer_stmnt_entity_exmpt_other_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_other_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_other_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_other_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_other_vw.entity_id = transfer_tax_stmnt.entity_4_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id

/* update the entity 5 exemption information */

update transfer_tax_stmnt 
set
	entity_5_hs_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_hs_vw
where
	transfer_stmnt_entity_exmpt_hs_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_hs_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_hs_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_hs_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_hs_vw.entity_id = transfer_tax_stmnt.entity_5_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id
		

update transfer_tax_stmnt 
set
	entity_5_ov65dp_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_ov65_vw
where
	transfer_stmnt_entity_exmpt_ov65_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_ov65_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_ov65_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_ov65_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_ov65_vw.entity_id = transfer_tax_stmnt.entity_5_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id
		

update transfer_tax_stmnt 
set
	entity_5_other_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_other_vw
where
	transfer_stmnt_entity_exmpt_other_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_other_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_other_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_other_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_other_vw.entity_id = transfer_tax_stmnt.entity_5_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id
		


/* update the entity 6 exemption information */

update transfer_tax_stmnt 
set
	entity_6_hs_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_hs_vw
where
	transfer_stmnt_entity_exmpt_hs_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_hs_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_hs_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_hs_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_hs_vw.entity_id = transfer_tax_stmnt.entity_6_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id

update transfer_tax_stmnt 
set
	entity_6_ov65dp_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_ov65_vw
where
	transfer_stmnt_entity_exmpt_ov65_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_ov65_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_ov65_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_ov65_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_ov65_vw.entity_id = transfer_tax_stmnt.entity_6_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id
		
update transfer_tax_stmnt 
set
	entity_6_other_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_other_vw
where
	transfer_stmnt_entity_exmpt_other_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_other_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_other_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_other_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_other_vw.entity_id = transfer_tax_stmnt.entity_6_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id




/* update the entity 7 exemption information */

update transfer_tax_stmnt 
set
	entity_7_hs_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_hs_vw
where
	transfer_stmnt_entity_exmpt_hs_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_hs_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_hs_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_hs_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_hs_vw.entity_id = transfer_tax_stmnt.entity_7_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id

update transfer_tax_stmnt 
set
	entity_7_ov65dp_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_ov65_vw
where
	transfer_stmnt_entity_exmpt_ov65_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_ov65_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_ov65_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_ov65_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_ov65_vw.entity_id = transfer_tax_stmnt.entity_7_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id
		

update transfer_tax_stmnt 
set
	entity_7_other_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_other_vw
where
	transfer_stmnt_entity_exmpt_other_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_other_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_other_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_other_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_other_vw.entity_id = transfer_tax_stmnt.entity_7_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id
		


/* update the entity 8 exemption information */

update transfer_tax_stmnt 
set
	entity_8_hs_amt    = exmpt_amt
from
	transfer_stmnt_entity_exmpt_hs_vw
where
	transfer_stmnt_entity_exmpt_hs_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_hs_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_hs_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_hs_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_hs_vw.entity_id = transfer_tax_stmnt.entity_8_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id
		

update transfer_tax_stmnt 
set
	entity_8_ov65dp_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_ov65_vw
where
	transfer_stmnt_entity_exmpt_ov65_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_ov65_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_ov65_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_ov65_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_ov65_vw.entity_id = transfer_tax_stmnt.entity_8_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id

update transfer_tax_stmnt 
set
	entity_8_other_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_other_vw
where
	transfer_stmnt_entity_exmpt_other_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_other_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_other_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_other_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_other_vw.entity_id = transfer_tax_stmnt.entity_8_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id

/* update the entity 9 exemption information */

update transfer_tax_stmnt 
set
	entity_9_hs_amt    = exmpt_amt
from
	transfer_stmnt_entity_exmpt_hs_vw
where
	transfer_stmnt_entity_exmpt_hs_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_hs_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_hs_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_hs_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_hs_vw.entity_id = transfer_tax_stmnt.entity_9_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id

update transfer_tax_stmnt 
set
	entity_9_ov65dp_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_ov65_vw
where
	transfer_stmnt_entity_exmpt_ov65_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_ov65_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_ov65_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_ov65_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_ov65_vw.entity_id = transfer_tax_stmnt.entity_9_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id

update transfer_tax_stmnt 
set
	entity_9_other_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_other_vw
where
	transfer_stmnt_entity_exmpt_other_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_other_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_other_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_other_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_other_vw.entity_id = transfer_tax_stmnt.entity_9_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id



/* update the entity 10 exemption information */

update transfer_tax_stmnt 
set
	entity_10_hs_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_hs_vw
where
	transfer_stmnt_entity_exmpt_hs_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_hs_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_hs_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_hs_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_hs_vw.entity_id = transfer_tax_stmnt.entity_10_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id

update transfer_tax_stmnt 
set
	entity_10_ov65dp_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_ov65_vw
where
	transfer_stmnt_entity_exmpt_ov65_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_ov65_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_ov65_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_ov65_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_ov65_vw.entity_id = transfer_tax_stmnt.entity_10_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id


update transfer_tax_stmnt 
set
	entity_10_other_amt = exmpt_amt
from
	transfer_stmnt_entity_exmpt_other_vw
where
	transfer_stmnt_entity_exmpt_other_vw.prop_id = transfer_tax_stmnt.prop_id
and	transfer_stmnt_entity_exmpt_other_vw.owner_id = transfer_tax_stmnt.owner_id
and	transfer_stmnt_entity_exmpt_other_vw.sup_num = transfer_tax_stmnt.sup_num
and	transfer_stmnt_entity_exmpt_other_vw.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	transfer_stmnt_entity_exmpt_other_vw.entity_id = transfer_tax_stmnt.entity_10_id
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id


/* update the entity_1 freeze information */
update transfer_tax_stmnt
set
	entity_1_freeze_exmpt_type_cd = isnull(pf.exmpt_type_cd, ' '),
	entity_1_freeze_yr = convert(char(4), pf.freeze_yr),
	entity_1_freeze_ceiling = convert(varchar(14), pf.freeze_ceiling)
from
	property_freeze as pf
where
	pf.prop_id = transfer_tax_stmnt.prop_id
and	pf.owner_id = transfer_tax_stmnt.owner_id
and	pf.sup_num = transfer_tax_stmnt.sup_num
and	pf.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.owner_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.entity_id = transfer_tax_stmnt.entity_1_id
and	pf.use_freeze = 'T'
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id



/* update the entity_2 freeze information */
update transfer_tax_stmnt
set
	entity_2_freeze_exmpt_type_cd = isnull(pf.exmpt_type_cd, ' '),
	entity_2_freeze_yr = convert(char(4), pf.freeze_yr),
	entity_2_freeze_ceiling = convert(varchar(14), pf.freeze_ceiling)
from
	property_freeze as pf
where
	pf.prop_id = transfer_tax_stmnt.prop_id
and	pf.owner_id = transfer_tax_stmnt.owner_id
and	pf.sup_num = transfer_tax_stmnt.sup_num
and	pf.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.owner_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.entity_id = transfer_tax_stmnt.entity_2_id
and	pf.use_freeze = 'T'
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id



/* update the entity_3 freeze information */
update transfer_tax_stmnt
set
	entity_3_freeze_exmpt_type_cd = isnull(pf.exmpt_type_cd, ' '),
	entity_3_freeze_yr = convert(char(4), pf.freeze_yr),
	entity_3_freeze_ceiling = convert(varchar(14), pf.freeze_ceiling)
from
	property_freeze as pf
where
	pf.prop_id = transfer_tax_stmnt.prop_id
and	pf.owner_id = transfer_tax_stmnt.owner_id
and	pf.sup_num = transfer_tax_stmnt.sup_num
and	pf.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.owner_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.entity_id = transfer_tax_stmnt.entity_3_id
and	pf.use_freeze = 'T'
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id



/* update the entity_4 freeze information */
update transfer_tax_stmnt
set
	entity_4_freeze_exmpt_type_cd = isnull(pf.exmpt_type_cd, ' '),
	entity_4_freeze_yr = convert(char(4), pf.freeze_yr),
	entity_4_freeze_ceiling = convert(varchar(14), pf.freeze_ceiling)
from
	property_freeze as pf
where
	pf.prop_id = transfer_tax_stmnt.prop_id
and	pf.owner_id = transfer_tax_stmnt.owner_id
and	pf.sup_num = transfer_tax_stmnt.sup_num
and	pf.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.owner_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.entity_id = transfer_tax_stmnt.entity_4_id
and	pf.use_freeze = 'T'
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id



/* update the entity_5 freeze information */
update transfer_tax_stmnt
set
	entity_5_freeze_exmpt_type_cd = isnull(pf.exmpt_type_cd, ' '),
	entity_5_freeze_yr = convert(char(4), pf.freeze_yr),
	entity_5_freeze_ceiling = convert(varchar(14), pf.freeze_ceiling)
from
	property_freeze as pf
where
	pf.prop_id = transfer_tax_stmnt.prop_id
and	pf.owner_id = transfer_tax_stmnt.owner_id
and	pf.sup_num = transfer_tax_stmnt.sup_num
and	pf.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.owner_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.entity_id = transfer_tax_stmnt.entity_5_id
and	pf.use_freeze = 'T'
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id



/* update the entity_6 freeze information */
update transfer_tax_stmnt
set
	entity_6_freeze_exmpt_type_cd = isnull(pf.exmpt_type_cd, ' '),
	entity_6_freeze_yr = convert(char(4), pf.freeze_yr),
	entity_6_freeze_ceiling = convert(varchar(14), pf.freeze_ceiling)
from
	property_freeze as pf
where
	pf.prop_id = transfer_tax_stmnt.prop_id
and	pf.owner_id = transfer_tax_stmnt.owner_id
and	pf.sup_num = transfer_tax_stmnt.sup_num
and	pf.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.owner_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.entity_id = transfer_tax_stmnt.entity_6_id
and	pf.use_freeze = 'T'
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id



/* update the entity_7 freeze information */
update transfer_tax_stmnt
set
	entity_7_freeze_exmpt_type_cd = isnull(pf.exmpt_type_cd, ' '),
	entity_7_freeze_yr = convert(char(4), pf.freeze_yr),
	entity_7_freeze_ceiling = convert(varchar(14), pf.freeze_ceiling)
from
	property_freeze as pf
where
	pf.prop_id = transfer_tax_stmnt.prop_id
and	pf.owner_id = transfer_tax_stmnt.owner_id
and	pf.sup_num = transfer_tax_stmnt.sup_num
and	pf.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.owner_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.entity_id = transfer_tax_stmnt.entity_7_id
and	pf.use_freeze = 'T'
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id



/* update the entity_8 freeze information */
update transfer_tax_stmnt
set
	entity_8_freeze_exmpt_type_cd = isnull(pf.exmpt_type_cd, ' '),
	entity_8_freeze_yr = convert(char(4), pf.freeze_yr),
	entity_8_freeze_ceiling = convert(varchar(14), pf.freeze_ceiling)
from
	property_freeze as pf
where
	pf.prop_id = transfer_tax_stmnt.prop_id
and	pf.owner_id = transfer_tax_stmnt.owner_id
and	pf.sup_num = transfer_tax_stmnt.sup_num
and	pf.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.owner_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.entity_id = transfer_tax_stmnt.entity_8_id
and	pf.use_freeze = 'T'
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id



/* update the entity_9 freeze information */
update transfer_tax_stmnt
set
	entity_9_freeze_exmpt_type_cd = isnull(pf.exmpt_type_cd, ' '),
	entity_9_freeze_yr = convert(char(4), pf.freeze_yr),
	entity_9_freeze_ceiling = convert(varchar(14), pf.freeze_ceiling)
from
	property_freeze as pf
where
	pf.prop_id = transfer_tax_stmnt.prop_id
and	pf.owner_id = transfer_tax_stmnt.owner_id
and	pf.sup_num = transfer_tax_stmnt.sup_num
and	pf.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.owner_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.entity_id = transfer_tax_stmnt.entity_9_id
and	pf.use_freeze = 'T'
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id



/* update the entity_10 freeze information */
update transfer_tax_stmnt
set
	entity_10_freeze_exmpt_type_cd = isnull(pf.exmpt_type_cd, ' '),
	entity_10_freeze_yr = convert(char(4), pf.freeze_yr),
	entity_10_freeze_ceiling = convert(varchar(14), pf.freeze_ceiling)
from
	property_freeze as pf
where
	pf.prop_id = transfer_tax_stmnt.prop_id
and	pf.owner_id = transfer_tax_stmnt.owner_id
and	pf.sup_num = transfer_tax_stmnt.sup_num
and	pf.exmpt_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.owner_tax_yr = transfer_tax_stmnt.sup_tax_yr
and	pf.entity_id = transfer_tax_stmnt.entity_10_id
and	pf.use_freeze = 'T'
and	transfer_tax_stmnt.stmnt_id = @statement_id	
and	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.event_id = @input_event_id



/* update the confidential owner */

update transfer_tax_stmnt
set
	mail_to_name = account.confidential_file_as_name
from
	account
where
	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.stmnt_id = @statement_id
and	transfer_tax_stmnt.event_id = @input_event_id
and	account.acct_id = transfer_tax_stmnt.mail_to_id
and	account.confidential_flag = 'T'


update transfer_tax_stmnt
set
	owner_name = account.confidential_file_as_name
from
	account
where
	transfer_tax_stmnt.sup_tax_yr = @input_stmnt_yr
and	transfer_tax_stmnt.prop_id = @input_prop_id
and	transfer_tax_stmnt.sup_num = @input_sup_num
and	transfer_tax_stmnt.owner_id = @input_owner_id
and	transfer_tax_stmnt.stmnt_id = @statement_id
and	transfer_tax_stmnt.event_id = @input_event_id
and	account.acct_id = transfer_tax_stmnt.owner_id
and	account.confidential_flag = 'T'



/* set the exemptions */

update
	transfer_tax_stmnt
set
	exemptions = dbo.fn_GetExemptions(tts.prop_id, tts.sup_tax_yr, tts.sup_num)
from
	transfer_tax_stmnt as tts with (nolock)
where
	tts.prop_id = @input_prop_id
and	tts.owner_id = @input_owner_id
and	tts.sup_num = @input_sup_num
and	tts.sup_tax_yr = @input_stmnt_yr
and	tts.stmnt_id = @statement_id



/* insert event */
select @event_desc = convert(varchar(4), @input_stmnt_yr)  +  ' Corrected Tax Statement created for Entities: '

if (@entity_1_cd <> ' ')
begin
	select @event_desc = @event_desc + @entity_1_cd
end
if (@entity_2_cd <> ' ')
begin
	select @event_desc = @event_desc + ', ' + @entity_2_cd
end
if (@entity_3_cd <> ' ')
begin
	select @event_desc = @event_desc + ', ' + @entity_3_cd
end
 if (@entity_4_cd <> ' ')
begin
	select @event_desc = @event_desc + ', ' + @entity_4_cd
end
if (@entity_5_cd <> ' ')
begin
	select @event_desc = @event_desc + ', ' + @entity_5_cd
end
if (@entity_6_cd <> ' ')
begin
	select @event_desc = @event_desc + ', ' + @entity_6_cd
end
if (@entity_7_cd <> ' ')
begin
	select @event_desc = @event_desc + ', ' + @entity_7_cd
end
if (@entity_8_cd <> ' ')
begin
	select @event_desc = @event_desc + ', ' + @entity_8_cd
end
if (@entity_9_cd <> ' ')
begin
	select @event_desc = @event_desc + ', ' + @entity_9_cd
end

if (@entity_10_cd <> ' ')
begin
	select @event_desc = @event_desc + ', ' + @entity_10_cd
end

insert into event
(
	event_id,
	system_type,
	event_type,
	event_date,
	pacs_user,
	event_desc,
	ref_evt_type,
	ref_year,
	ref_id1,
	ref_id2,
	ref_id3,
	ref_id4,
	ref_id5,
	ref_id6
)
values
(
	@input_event_id,
	'C',
	'SYSTEM',
	GetDate(),
	@input_user_id,
	@event_desc,
	'CTS',
	@input_stmnt_yr,
	0,
	@input_sup_num,
	0,
	@input_prop_id,
	@input_owner_id,
	@statement_id
)

insert into prop_event_assoc
(
	prop_id,
	event_id
)
values
(
	@input_prop_id,
	@input_event_id
)



-------------------------------------------------
--Find out if we need to calculate the history --
-------------------------------------------------

declare @form varchar(15)
declare @levy_group_id		int
declare @levy_run_id		int
declare @smnt_id            int
-------------------------------------------------
SELECT @levy_group_id = levy_group_id,
       @levy_run_id   = levy_run_id,
       @smnt_id       = stmnt_id
FROM transfer_tax_stmnt
WHERE levy_group_yr = @input_stmnt_yr
AND sup_num = @input_sup_num
AND prop_id = @input_prop_id
AND owner_id = @input_owner_id
AND event_id = @input_event_id

-------------------------------------------------

    exec CreateTransferPropertyTaxStmntHistory  @input_stmnt_yr,@input_sup_num, @input_prop_id,  @input_owner_id, @input_event_id, @input_user_id

-------------------------------------------------

GO

