

create procedure PopulateAppraisalTotals
	@input_yr		numeric(4,0),
	@input_pacs_user_id	int,
	@input_sup_num		int,
	@report_type		char(1) = '',
	@input_prop_query	varchar(2000) = '',
	@input_skip_etr_totals bit = 1,
	@input_tnt_export_id int = 0,
	@input_arb_approved bit = 1,
	@input_under_arb bit = 1,
	@input_grand_totals bit = 1,
	@input_appr_company_id int = null,
	@input_validation_id int = 0

with recompile
as

SET NOCOUNT ON

/* added by jcoco to take care of query error message */
select @input_prop_query = replace(@input_prop_query, '"', '''')

declare @strSQL varchar(3000)
declare @start_time datetime
declare @end_time datetime
declare @event_desc varchar(2048)


if (@input_yr = 0)
begin
	delete from appraisal_totals
	where pacs_user_id = @input_pacs_user_id
	and tnt_export_id = @input_tnt_export_id

	delete from appraisal_totals_exemptions
	where pacs_user_id = @input_pacs_user_id
	and tnt_export_id = @input_tnt_export_id

	delete from appraisal_totals_freezes
	where pacs_user_id = @input_pacs_user_id
	and tnt_export_id = @input_tnt_export_id

	delete from appraisal_totals_transfers
	where pacs_user_id = @input_pacs_user_id
	and tnt_export_id = @input_tnt_export_id

	delete from appraisal_totals_state_cd 
	where pacs_user_id = @input_pacs_user_id
	and tnt_export_id = @input_tnt_export_id

	DELETE FROM appraisal_totals_new_value
	WHERE pacs_user_id = @input_pacs_user_id
	and tnt_export_id = @input_tnt_export_id

	DELETE FROM appraisal_totals_new_exemptions
	WHERE pacs_user_id = @input_pacs_user_id
	and tnt_export_id = @input_tnt_export_id

	DELETE FROM appraisal_totals_new_ag
	WHERE pacs_user_id = @input_pacs_user_id
	and tnt_export_id = @input_tnt_export_id

	DELETE FROM appraisal_totals_new_annex
	WHERE pacs_user_id = @input_pacs_user_id
	and tnt_export_id = @input_tnt_export_id

	DELETE FROM appraisal_totals_new_deannex
	WHERE pacs_user_id = @input_pacs_user_id
	and tnt_export_id = @input_tnt_export_id

	DELETE FROM appraisal_totals_new_ave_hs
	WHERE pacs_user_id = @input_pacs_user_id
	and tnt_export_id = @input_tnt_export_id

	delete from appraisal_totals_cad_state_cd 
	where pacs_user_id = @input_pacs_user_id
	and tnt_export_id = @input_tnt_export_id

	delete from appraisal_totals_protest_value 
	where pacs_user_id = @input_pacs_user_id
	and tnt_export_id = @input_tnt_export_id
end
else
begin
	set @start_time = getdate()

	create table #appraisal_totals_supp_assoc
	(
		prop_id int not null,
		year numeric(4,0) not null,
		sup_num int not null,
		primary key clustered (year, sup_num, prop_id) with fillfactor = 100
	)

	if (@report_type <> 'L')
	begin
		set @strSQL = '
			insert into #appraisal_totals_supp_assoc
			select
				distinct xpoev.prop_id, ' + cast(@input_yr as varchar(4)) + ', max(xpoev.sup_num) ' + '
			from prop_owner_entity_val as xpoev with (nolock) '

		if (isnull(@input_appr_company_id, -1) >= 0)
		begin
			set @strSQL = @strSQL + '
				inner join property_val as xpv with (nolock) ' + '
				on xpv.prop_id = xpoev.prop_id ' + '
				and xpv.prop_val_yr = xpoev.sup_yr ' + '
				and xpv.sup_num = xpoev.sup_num ' + '
				and xpv.appr_company_id = ' + cast(@input_appr_company_id as varchar(9)) + ' '
		end

		set @strSQL = @strSQL + '
			where
				xpoev.sup_yr = ' + cast(@input_yr as varchar(4)) + '
				and xpoev.sup_num <= ' + cast(@input_sup_num as varchar(5))

		if (@input_prop_query <> '')
		begin
			set @strSQL = @strSQL + ' and xpoev.prop_id in (' + @input_prop_query + ') '
		end

		set @strSQL = @strSQL + ' group by xpoev.prop_id '
		set @strSQL = @strSQL + ' order by 3, 1 '

		exec(@strSQL)
	end
	else
	begin
		if (isnull(@input_appr_company_id, -1) >= 0)
		begin
			insert into #appraisal_totals_supp_assoc
			select distinct
				xlsa.prop_id,
				xlsa.sup_yr,
				xlsa.sup_num
			from
				levy_supp_assoc as xlsa with (nolock)
			inner join
				property_val as xpv with (nolock)
			on
				xpv.prop_id = xlsa.prop_id
			and	xpv.prop_val_yr = xlsa.sup_yr
			and	xpv.sup_num = xlsa.sup_num
			and	xpv.appr_company_id = @input_appr_company_id
			where
				xlsa.sup_yr = @input_yr
		end
		else
		begin
			insert into #appraisal_totals_supp_assoc
			select distinct
				prop_id,
				sup_yr,
				sup_num
			from
				levy_supp_assoc with (nolock)
			where
				sup_yr = @input_yr
		end
	end

	insert into appraisal_totals
	(
		entity_id,
		prop_val_yr,
		pacs_user_id,
		arb_status,
		date_time,
		prop_count,
		land_hstd_val,
		land_non_hstd_val,
		imprv_hstd_val,
		imprv_non_hstd_val,
		personal_prop_count,
		personal_val,
		mineral_prop_count,
		mineral_val,
		auto_prop_count,
		auto_val,
		ag_market,
		timber_market,
		ag_use,
		timber_use,
		productivity_loss,
		ag_market_ex,
		timber_market_ex,
		ag_use_ex,
		timber_use_ex,
		productivity_loss_ex,
		ten_percent_cap,
		tax_increment_loss,
		weed_taxable_acres,
		tnt_export_id,
		sup_num
	)
	select
		prop_owner_entity_val.entity_id,
		sup_yr as prop_val_yr,
		@input_pacs_user_id,
		arb_status,
		getdate(),
		count(prop_owner_entity_val.prop_id) as prop_count,
		sum(isnull(prop_owner_entity_val.land_hstd_val,0)) as land_hstd_val,
		sum(isnull(prop_owner_entity_val.land_non_hstd_val,0)) as land_non_hstd_val,
		sum(isnull(prop_owner_entity_val.imprv_hstd_val,0)) as imprv_hstd_val,
		sum(isnull(prop_owner_entity_val.imprv_non_hstd_val,0)) as imprv_non_hstd_val,
		sum(case when prop_owner_entity_val.prop_type_cd = 'P' then 1 else 0 end) as personal_prop_count,
		sum(case when prop_owner_entity_val.prop_type_cd = 'P' then isnull(prop_owner_entity_val.assessed_val,0) + isnull(prop_owner_entity_val.ten_percent_cap,0) else 0 end) as personal_val,
		sum(case when prop_owner_entity_val.prop_type_cd = 'MN' then 1 else 0 end) as mineral_prop_count,
		sum(case when prop_owner_entity_val.prop_type_cd = 'MN' then isnull(prop_owner_entity_val.assessed_val,0) + isnull(prop_owner_entity_val.ten_percent_cap,0) else 0 end) as mineral_val,
		sum(case when prop_owner_entity_val.prop_type_cd = 'A' then 1 else 0 end) as auto_prop_count,
		sum(case when prop_owner_entity_val.prop_type_cd = 'A' then isnull(prop_owner_entity_val.assessed_val,0) + isnull(prop_owner_entity_val.ten_percent_cap,0) else 0 end) as auto_val,
		sum(case when isnull(prop_owner_entity_val.exempt_val,0) = 0 then isnull(prop_owner_entity_val.ag_market,0) else 0 end) as ag_market,
		sum(case when isnull(prop_owner_entity_val.exempt_val,0) = 0 then isnull(prop_owner_entity_val.timber_market,0) else 0 end) as timber_market,
		sum(case when isnull(prop_owner_entity_val.exempt_val,0) = 0 then isnull(prop_owner_entity_val.ag_use_val,0) else 0 end) as ag_use,
		sum(case when isnull(prop_owner_entity_val.exempt_val,0) = 0 then isnull(prop_owner_entity_val.timber_use,0) else 0 end) as timber_use,
		sum(case when isnull(prop_owner_entity_val.exempt_val,0) = 0 then isnull(prop_owner_entity_val.ag_market,0) + isnull(prop_owner_entity_val.timber_market,0) - isnull(prop_owner_entity_val.ag_use_val,0) - isnull(prop_owner_entity_val.timber_use,0) else 0 end) as productivity_loss,
		sum(case when isnull(prop_owner_entity_val.exempt_val,0) > 0 then isnull(prop_owner_entity_val.ag_market,0) else 0 end) as ag_market_ex,
		sum(case when isnull(prop_owner_entity_val.exempt_val,0) > 0 then isnull(prop_owner_entity_val.timber_market,0) else 0 end) as timber_market_ex,
		sum(case when isnull(prop_owner_entity_val.exempt_val,0) > 0 then isnull(prop_owner_entity_val.ag_use_val,0) else 0 end) as ag_use_ex,
		sum(case when isnull(prop_owner_entity_val.exempt_val,0) > 0 then isnull(prop_owner_entity_val.timber_use,0) else 0 end) as timber_use_ex,
		sum(case when isnull(prop_owner_entity_val.exempt_val,0) > 0 then isnull(prop_owner_entity_val.ag_market,0) + isnull(prop_owner_entity_val.timber_market,0) - isnull(prop_owner_entity_val.ag_use_val,0) - isnull(prop_owner_entity_val.timber_use,0) else 0 end) as productivity_loss_ex,
		sum(isnull(prop_owner_entity_val.ten_percent_cap,0)) as ten_percent_cap,
		sum(case when property_val.tif_flag = 'T' and isnull(prop_owner_entity_val.tax_increment_imprv_val,0) + isnull(prop_owner_entity_val.tax_increment_land_val,0) <= prop_owner_entity_val.taxable_val then isnull(prop_owner_entity_val.taxable_val,0) - isnull(prop_owner_entity_val.tax_increment_imprv_val,0) - isnull(prop_owner_entity_val.tax_increment_land_val,0) else 0 end) as tax_increment_loss,
		sum(isnull(weed_taxable_acres,0)) as weed_taxable_acres,
		@input_tnt_export_id,
		@input_sup_num
	from
		#appraisal_totals_supp_assoc as a with (nolock)
	join
		appraisal_totals_criteria_entity as ce with (nolock)
	on
		ce.pacs_user_id = @input_pacs_user_id
	and	ce.tnt_export_id = @input_tnt_export_id
	join
		appraisal_totals_criteria_proptype as cp with (nolock)
	on
		cp.pacs_user_id = @input_pacs_user_id
	and	cp.tnt_export_id = @input_tnt_export_id
	join
		prop_owner_entity_val with (nolock)
	on
		prop_owner_entity_val.sup_yr = @input_yr
	and	a.sup_num = prop_owner_entity_val.sup_num
	and	ce.entity_id = prop_owner_entity_val.entity_id
	and	a.prop_id = prop_owner_entity_val.prop_id
	and	cp.prop_type_cd = prop_owner_entity_val.prop_type_cd
	join
		property_val with (nolock)
	on
		prop_owner_entity_val.prop_id = property_val.prop_id
	and	property_val.prop_val_yr = @input_yr
	and	prop_owner_entity_val.sup_num = property_val.sup_num
	and	property_val.prop_inactive_dt is null
	where
		a.year = @input_yr
	group by
		prop_owner_entity_val.entity_id,
		sup_yr,
		arb_status

-- Now populate the appraisal_totals_exemptions table

	insert into appraisal_totals_exemptions
	(
		entity_id,
		prop_val_yr,
		pacs_user_id,
		arb_status,
		exempt_type_cd,
		exempt_count,
		exempt_local_amt,
		exempt_state_amt,
		tnt_export_id
	)
	select
		property_entity_exemption.entity_id,
		@input_yr,
		@input_pacs_user_id,
		arb_status,
		exmpt_type_cd as exempt_type_cd,
		count(exmpt_type_cd) as exempt_count,
		sum(local_amt) as exempt_local_amt,
		sum(state_amt) as exempt_state_amt,
		@input_tnt_export_id
	from
		#appraisal_totals_supp_assoc as a with (nolock)
	join
		appraisal_totals_criteria_entity as ce with (nolock)
	on
		ce.pacs_user_id = @input_pacs_user_id
	and	ce.tnt_export_id = @input_tnt_export_id
	join
		appraisal_totals_criteria_proptype as cp with (nolock)
	on	cp.pacs_user_id = @input_pacs_user_id
	and	cp.tnt_export_id = @input_tnt_export_id
	join
		property_entity_exemption with (nolock)
	on
		property_entity_exemption.owner_tax_yr = @input_yr
	and	a.sup_num = property_entity_exemption.sup_num
	and	ce.entity_id = property_entity_exemption.entity_id
	and	a.prop_id = property_entity_exemption.prop_id
	and	(
			property_entity_exemption.prorate_pct is null
		or	property_entity_exemption.prorate_pct = 1
		)
	join
		prop_owner_entity_val with (nolock)
	on	prop_owner_entity_val.sup_yr = @input_yr
	and	property_entity_exemption.sup_num = prop_owner_entity_val.sup_num
	and	property_entity_exemption.entity_id = prop_owner_entity_val.entity_id
	and	property_entity_exemption.prop_id = prop_owner_entity_val.prop_id
	and	property_entity_exemption.owner_id = prop_owner_entity_val.owner_id
	and	cp.prop_type_cd = prop_owner_entity_val.prop_type_cd
	join
		property_val with (nolock)
	on
		property_entity_exemption.prop_id = property_val.prop_id
	and	property_val.prop_val_yr = @input_yr
	and	property_entity_exemption.sup_num = property_val.sup_num
	and	property_val.prop_inactive_dt is null
	where
		a.year = @input_yr
	group by
		property_entity_exemption.entity_id,
		arb_status,
		exmpt_type_cd

	insert into appraisal_totals_exemptions
	(
		entity_id,
		prop_val_yr,
		pacs_user_id,
		arb_status,
		exempt_type_cd,
		exempt_count,
		exempt_local_amt,
		exempt_state_amt,
		tnt_export_id
	)
	select
		property_entity_exemption.entity_id,
		@input_yr,
		@input_pacs_user_id,
		arb_status,
		'EX (Prorated)',
		count(exmpt_type_cd) as exempt_count,
		sum(local_amt) as exempt_local_amt,
		sum(state_amt) as exempt_state_amt,
		@input_tnt_export_id
	from
		#appraisal_totals_supp_assoc with (nolock)
	join
		appraisal_totals_criteria_entity as ce with (nolock)
	on
		ce.pacs_user_id = @input_pacs_user_id
	and	ce.tnt_export_id = @input_tnt_export_id
	join
		appraisal_totals_criteria_proptype as cp with (nolock)
	on
		cp.pacs_user_id = @input_pacs_user_id
	and	cp.tnt_export_id = @input_tnt_export_id
	join
		property_entity_exemption with (nolock)
	on
		property_entity_exemption.owner_tax_yr = @input_yr
	and	#appraisal_totals_supp_assoc.sup_num = property_entity_exemption.sup_num
	and	ce.entity_id = property_entity_exemption.entity_id
	and	#appraisal_totals_supp_assoc.prop_id = property_entity_exemption.prop_id
	join
		property with (nolock)
	on
		property_entity_exemption.prop_id = property.prop_id
	and	cp.prop_type_cd = property.prop_type_cd
	join
		prop_owner_entity_val with (nolock)
	on
		prop_owner_entity_val.sup_yr = @input_yr
	and	property_entity_exemption.sup_num = prop_owner_entity_val.sup_num
	and	property_entity_exemption.entity_id = prop_owner_entity_val.entity_id
	and	property_entity_exemption.prop_id = prop_owner_entity_val.prop_id
	and	property_entity_exemption.owner_id = prop_owner_entity_val.owner_id
	and	property_entity_exemption.exmpt_type_cd = 'EX'
	and	(
			property_entity_exemption.prorate_pct > 0
		and	property_entity_exemption.prorate_pct < 1
		)
	join
		property_val with (nolock)
	on
		property_entity_exemption.prop_id = property_val.prop_id
	and	property_val.prop_val_yr = @input_yr
	and	property_entity_exemption.sup_num = property_val.sup_num
	and	property_val.prop_inactive_dt is null
	where
		#appraisal_totals_supp_assoc.year = @input_yr
	group by
		property_entity_exemption.entity_id,
		arb_status,
		exmpt_type_cd

	--EricZ; 07/15/2004
	insert into appraisal_totals_exemptions
	(
		entity_id,
		prop_val_yr,
		pacs_user_id,
		arb_status,
		exempt_type_cd,
		exempt_count,
		exempt_local_amt,
		exempt_state_amt,
		tnt_export_id
	)
	select
		ce.entity_id,
		@input_yr,
		@input_pacs_user_id,
		'C',
		'',
		0,
		0,
		0,
		0
	from
		appraisal_totals_criteria_entity as ce with (nolock)
	where
		ce.pacs_user_id = @input_pacs_user_id
	and	ce.tnt_export_id = @input_tnt_export_id
	and	ce.entity_id not in
		(
			select
				entity_id
			from
				appraisal_totals_exemptions
			where
				pacs_user_id = @input_pacs_user_id
			and	tnt_export_id = @input_tnt_export_id
		)

-- Now update the total_exemption_amount column in the appraisal_totals table

	update appraisal_totals
	set
		total_exemption_amount = total_amt
	from
		(
		select
			ate.entity_id,
			ate.arb_status,
			ate.prop_val_yr,
			ate.pacs_user_id,
			ate.tnt_export_id,
			sum(isnull(exempt_local_amt,0) + isnull(exempt_state_amt,0)) as total_amt
		from
			appraisal_totals_exemptions as ate
		inner join
			appraisal_totals as at
		on
			ate.pacs_user_id = at.pacs_user_id
		and	ate.prop_val_yr = at.prop_val_yr
		and	ate.entity_id = at.entity_id
		and	ate.tnt_export_id = at.tnt_export_id
		and	ate.arb_status = at.arb_status
		where
			at.pacs_user_id = @input_pacs_user_id
		and	at.prop_val_yr = @input_yr
		and	at.tnt_export_id = @input_tnt_export_id
		group by
			ate.tnt_export_id,
			ate.pacs_user_id,
			ate.prop_val_yr,
			ate.entity_id,
			ate.arb_status
		) as ate_temp
	where
		appraisal_totals.arb_status = ate_temp.arb_status
	and	appraisal_totals.entity_id = ate_temp.entity_id
	and	appraisal_totals.prop_val_yr = ate_temp.prop_val_yr
	and	appraisal_totals.pacs_user_id = ate_temp.pacs_user_id
	and	appraisal_totals.tnt_export_id = ate_temp.tnt_export_id

	--EricZ; 07/15/2004
	update appraisal_totals
	set
		total_exemption_amount = 0
	where
		total_exemption_amount is null

	
-- Now populate the appraisal_totals_freezes table
	
	insert into appraisal_totals_freezes
	(
		entity_id,
		prop_val_yr,
		pacs_user_id,
		arb_status,
		date_time,
		exmpt_type_cd,
		freeze_assessed,
		freeze_taxable,
		actual_tax,
		freeze_ceiling_count,
		freeze_ceiling_amount,
		tnt_export_id
	)
	select
		poev.entity_id,
		@input_yr,
		@input_pacs_user_id,
		poev.arb_status,
		getdate(),
		ee.exmpt_type_cd,
		sum(case when poev.freeze_type = ee.exmpt_type_cd then isnull(poev.frz_assessed_val, 0) else 0 end) as freeze_assessed,
		sum(case when poev.freeze_type = ee.exmpt_type_cd then isnull(poev.frz_taxable_val, 0) else 0 end) as freeze_taxable,
		sum(case when poev.freeze_type = ee.exmpt_type_cd then isnull(poev.frz_actual_tax, 0) else 0 end) as actual_tax,
		sum(case when poev.freeze_type = ee.exmpt_type_cd then case when poev.freeze_ceiling >= 0 then 1 else 0 end else 0 end) as freeze_ceiling_count,
		sum(case when poev.freeze_type = ee.exmpt_type_cd then isnull(poev.freeze_ceiling, 0) else 0 end) as freeze_ceiling_amount,
		@input_tnt_export_id
	from
		#appraisal_totals_supp_assoc as a with (nolock)
	join
		appraisal_totals_criteria_entity as ce with (nolock)
	on
		ce.pacs_user_id = @input_pacs_user_id
	and	ce.tnt_export_id = @input_tnt_export_id
	join
		appraisal_totals_criteria_proptype as cp with (nolock)
	on
		cp.pacs_user_id = @input_pacs_user_id
	and	cp.tnt_export_id = @input_tnt_export_id
	join
		prop_owner_entity_val as poev with (nolock)
	on
		poev.sup_yr = @input_yr
	and	a.sup_num = poev.sup_num
	and	ce.entity_id = poev.entity_id
	and	a.prop_id = poev.prop_id
	and	cp.prop_type_cd = poev.prop_type_cd
	join
		property_val with (nolock)
	on
		poev.prop_id = property_val.prop_id
	and	property_val.prop_val_yr = @input_yr
	and	poev.sup_num = property_val.sup_num
	and	property_val.prop_inactive_dt is null
	join
		entity_exmpt as ee with (nolock)
	on
		poev.entity_id = ee.entity_id
	and	poev.sup_yr = ee.exmpt_tax_yr
	and	poev.freeze_type = ee.exmpt_type_cd
	and	ee.freeze_flag = 1
	where
		a.year = @input_yr
	group by
		poev.entity_id,
		poev.arb_status,
		ee.exmpt_type_cd



-- Now populate the appraisal_totals_transfers table
	
	insert into appraisal_totals_transfers
	(
		entity_id,
		prop_val_yr,
		pacs_user_id,
		arb_status,
		date_time,
		exmpt_type_cd,
		transfer_totals,
		transfer_assessed,
		transfer_taxable,
		post_percent_taxable,
		transfer_adjustment,
		transfer_count,
		tnt_export_id
	)
	select
		poev.entity_id,
		@input_yr,
		@input_pacs_user_id,
		poev.arb_status,
		getdate(),
		ee.exmpt_type_cd,
		0 as transfer_totals,
		sum(case when poev.freeze_type = (rtrim(ee.exmpt_type_cd) + 'T') then isnull(poev.transfer_freeze_assessed, 0) else 0 end) as transfer_assessed,
		sum(case when poev.freeze_type = (rtrim(ee.exmpt_type_cd) + 'T') then isnull(poev.transfer_freeze_taxable, 0) else 0 end) as transfer_taxable,
		sum(case when poev.freeze_type = (rtrim(ee.exmpt_type_cd) + 'T') then isnull(poev.transfer_entity_taxable, 0) else 0 end) as post_percent_taxable,
		sum(case when poev.freeze_type = (rtrim(ee.exmpt_type_cd) + 'T') then isnull(poev.transfer_taxable_adjustment, 0) else 0 end) as transfer_adjustment,
		sum(case when poev.freeze_type = (rtrim(ee.exmpt_type_cd) + 'T') then 1 else 0 end) as transfer_count,
		@input_tnt_export_id
	from
		#appraisal_totals_supp_assoc as a with (nolock)
	join
		appraisal_totals_criteria_entity as ce with (nolock)
	on
		ce.pacs_user_id = @input_pacs_user_id
	and	ce.tnt_export_id = @input_tnt_export_id
	join
		appraisal_totals_criteria_proptype as cp with (nolock)
	on
		cp.pacs_user_id = @input_pacs_user_id
	and	cp.tnt_export_id = @input_tnt_export_id
	join
		prop_owner_entity_val as poev with (nolock)
	on
		poev.sup_yr = @input_yr
	and	a.sup_num = poev.sup_num
	and	ce.entity_id = poev.entity_id
	and	a.prop_id = poev.prop_id
	and	cp.prop_type_cd = poev.prop_type_cd
	join
		property_val with (nolock)
	on
		poev.prop_id = property_val.prop_id
	and	property_val.prop_val_yr = @input_yr
	and	poev.sup_num = property_val.sup_num
	and	property_val.prop_inactive_dt is null
	join
		entity_exmpt as ee with (nolock)
	on
		poev.entity_id = ee.entity_id
	and	poev.sup_yr = ee.exmpt_tax_yr
	and	poev.freeze_type = (rtrim(ee.exmpt_type_cd) + 'T')
	and	ee.freeze_flag = 1
	and	ee.transfer_flag = 1
	where
		a.year = @input_yr
	group by
		poev.entity_id,
		poev.arb_status,
		ee.exmpt_type_cd



	if (@input_yr >= 1990)
	begin
		insert into appraisal_totals_state_cd
		(
			entity_id,
			prop_val_yr,
			pacs_user_id,
			date_time,
			state_cd,
			prop_ct,
			market,
			acres,
			new_val,
			arb_status,
			tnt_export_id
		)
		select
			poes.entity_id,
			@input_yr,
			@input_pacs_user_id,
			GetDate(),
			poes.state_cd,
			count(distinct poes.prop_id),
			sum(poes.market),
			sum(poes.acres),
			sum(poes.new_val),
			poes.arb_status,
			@input_tnt_export_id
		from
			#appraisal_totals_supp_assoc as atsa with (nolock)
		join
			appraisal_totals_criteria_entity as ce with (nolock)
		on
			ce.pacs_user_id = @input_pacs_user_id
		and	ce.tnt_export_id = @input_tnt_export_id
		join
			appraisal_totals_criteria_proptype as cp with (nolock)
		on
			cp.pacs_user_id = @input_pacs_user_id
		and	cp.tnt_export_id = @input_tnt_export_id
		join
			property_owner_entity_state_cd as poes with (nolock)
		on
			poes.year = @input_yr
		and	atsa.sup_num = poes.sup_num
		and	ce.entity_id = poes.entity_id
		and	atsa.prop_id = poes.prop_id
		join
			property as p with (nolock)
		on
			poes.prop_id = p.prop_id
		and	cp.prop_type_cd = p.prop_type_cd
		join
			property_val as pv with (nolock)
		on
			poes.prop_id = pv.prop_id
		and	pv.prop_val_yr = @input_yr
		and	poes.sup_num = pv.sup_num
		and	pv.prop_inactive_dt is null
		where
			atsa.year = @input_yr
		group by
			poes.entity_id,
			poes.state_cd,
			poes.arb_status

		update appraisal_totals_state_cd
		set
			state_cd_desc = ptd_state_code.state_desc
		from
			ptd_state_code with (nolock)
		where
			appraisal_totals_state_cd.pacs_user_id = @input_pacs_user_id
		and	appraisal_totals_state_cd.prop_val_yr = @input_yr
		and	appraisal_totals_state_cd.state_cd = ptd_state_code.state_cd
		and	appraisal_totals_state_cd.tnt_export_id = @input_tnt_export_id

		insert into appraisal_totals_cad_state_cd
		(
			entity_id,
			prop_val_yr,
			pacs_user_id,
			date_time,
			state_cd,
			prop_ct,
			market,
			acres,
			new_val,
			arb_status,
			tnt_export_id
		)
		select
			poes.entity_id,
			@input_yr,
			@input_pacs_user_id,
			GetDate(),
			poes.state_cd,
			count(distinct poes.prop_id),
			sum(poes.market),
			sum(poes.acres),
			sum(poes.new_val),
			poes.arb_status,
			@input_tnt_export_id
		from
			#appraisal_totals_supp_assoc as atsa with (nolock)
		join
			appraisal_totals_criteria_entity as ce with (nolock)
		on
			ce.pacs_user_id = @input_pacs_user_id
		and	ce.tnt_export_id = @input_tnt_export_id
		join
			appraisal_totals_criteria_proptype as cp with (nolock)
		on
			cp.pacs_user_id = @input_pacs_user_id
		and	cp.tnt_export_id = @input_tnt_export_id
		join
			property_owner_entity_cad_state_cd as poes with (nolock)
		on	poes.year = @input_yr
		and	atsa.sup_num = poes.sup_num
		and	ce.entity_id = poes.entity_id
		and	atsa.prop_id = poes.prop_id
		join
			property as p with (nolock)
		on	poes.prop_id = p.prop_id
		and	cp.prop_type_cd = p.prop_type_cd
		join
			property_val as pv with (nolock)
		on	poes.prop_id = pv.prop_id
		and	pv.prop_val_yr = @input_yr
		and	poes.sup_num = pv.sup_num
		and	pv.prop_inactive_dt is null
		where
			atsa.year = @input_yr
		group by
			poes.entity_id,
			poes.state_cd,
			poes.arb_status

		update appraisal_totals_cad_state_cd
		set
--			appraisal_totals_cad_state_cd.state_cd_desc = psc.state_desc
			state_cd_desc = sc.state_cd_desc
		from appraisal_totals_cad_state_cd
		join state_code as sc with(nolock) on
			appraisal_totals_cad_state_cd.state_cd = sc.state_cd
		join ptd_state_code as psc with(nolock) on
			sc.ptd_state_cd = psc.state_cd
		where
			appraisal_totals_cad_state_cd.pacs_user_id = @input_pacs_user_id and
			appraisal_totals_cad_state_cd.prop_val_yr = @input_yr and
			appraisal_totals_cad_state_cd.tnt_export_id = @input_tnt_export_id
	end
	else
	begin
		insert into appraisal_totals_state_cd
		(
			entity_id,
			prop_val_yr,
			pacs_user_id,
			date_time,
			state_cd,
			prop_ct,
			market,
			acres,
			new_val,
			arb_status,
			tnt_export_id
		)
		select
			entity_id,
			prop_val_yr,
			pacs_user_id,
			GetDate(),
			'',
			0,
			0,
			0,
			0,
			arb_status,
			@input_tnt_export_id
		from
			appraisal_totals with (nolock)
		where
			pacs_user_id = @input_pacs_user_id
		and	tnt_export_id = @input_tnt_export_id
		and	prop_val_yr = @input_yr

		insert into appraisal_totals_cad_state_cd
		(
			entity_id,
			prop_val_yr,
			pacs_user_id,
			date_time,
			state_cd,
			prop_ct,
			market,
			acres,
			new_val,
			arb_status,
			tnt_export_id
		)
		select
			entity_id,
			prop_val_yr,
			pacs_user_id,
			GetDate(),
			'',
			0,
			0,
			0,
			0,
			arb_status,
			@input_tnt_export_id
		from
			appraisal_totals with (nolock)
		where
			pacs_user_id = @input_pacs_user_id
		and	tnt_export_id = @input_tnt_export_id
		and	prop_val_yr = @input_yr
	end

	/*
	 * This section is for doing the entity subtotal pages for the totals report
	 *
	 * RAA 09/16/2004
	 */

	if @input_grand_totals = 1
	begin
		insert into appraisal_totals
		(
			entity_id,
			prop_val_yr,
			pacs_user_id,
			arb_status,
			date_time,
			prop_count,
			land_hstd_val,
			land_non_hstd_val,
			imprv_hstd_val,
			imprv_non_hstd_val,
			personal_prop_count,
			personal_val,
			mineral_prop_count,
			mineral_val,
			auto_prop_count,
			auto_val,
			ag_market,
			timber_market,
			ag_use,
			timber_use,
			productivity_loss,
			ag_market_ex,
			timber_market_ex,
			ag_use_ex,
			timber_use_ex,
			productivity_loss_ex,
			ten_percent_cap,
			tax_increment_loss,
			weed_taxable_acres,
			tnt_export_id,
			sup_num
		)
		select
			entity_id,
			prop_val_yr,
			pacs_user_id,
			'0',
			getdate(),
			sum(prop_count) as prop_count,
			sum(land_hstd_val) as land_hstd_val,
			sum(land_non_hstd_val) as land_non_hstd_val,
			sum(imprv_hstd_val) as imprv_hstd_val,
			sum(imprv_non_hstd_val) as imprv_non_hstd_val,
			sum(personal_prop_count) as personal_prop_count,
			sum(personal_val) as personal_val,
			sum(mineral_prop_count) as mineral_prop_count,
			sum(mineral_val) as mineral_val,
			sum(auto_prop_count) as auto_prop_count,
			sum(auto_val) as auto_val,
			sum(ag_market) as ag_market,
			sum(timber_market) as timber_market,
			sum(ag_use) as ag_use,
			sum(timber_use) as timber_use,
			sum(productivity_loss) as productivity_loss,
			sum(ag_market_ex) as ag_market_ex,
			sum(timber_market_ex) as timber_market_ex,
			sum(ag_use_ex) as ag_use_ex,
			sum(timber_use_ex) as timber_use_ex,
			sum(productivity_loss_ex) as productivity_loss_ex,
			sum(ten_percent_cap) as ten_percent_cap,
			sum(tax_increment_loss) as tax_increment_loss,
			sum(weed_taxable_acres) as weed_taxable_acres,
			tnt_export_id,
			@input_sup_num
		from
			appraisal_totals
		where
			pacs_user_id = @input_pacs_user_id
		and	prop_val_yr = @input_yr
		and	tnt_export_id = @input_tnt_export_id
		group by
			entity_id,
			prop_val_yr,
			pacs_user_id,
			tnt_export_id

		insert into appraisal_totals_exemptions
		(
			entity_id,
			prop_val_yr,
			pacs_user_id,
			arb_status,
			exempt_type_cd,
			exempt_count,
			exempt_local_amt,
			exempt_state_amt,
			tnt_export_id
		)
		select
			entity_id,
			prop_val_yr,
			pacs_user_id,
			'0',
			exempt_type_cd,
			sum(exempt_count) as exempt_count,
			sum(exempt_local_amt) as exempt_local_amt,
			sum(exempt_state_amt) as exempt_state_amt,
			tnt_export_id
		from
			appraisal_totals_exemptions
		where
			pacs_user_id = @input_pacs_user_id
		and	prop_val_yr = @input_yr
		and	tnt_export_id = @input_tnt_export_id
		group by
			entity_id,
			prop_val_yr,
			pacs_user_id,
			exempt_type_cd,
			tnt_export_id

		insert into appraisal_totals_freezes
		(
			entity_id,
			prop_val_yr,
			pacs_user_id,
			arb_status,
			date_time,
			exmpt_type_cd,
			freeze_assessed,
			freeze_taxable,
			actual_tax,
			freeze_ceiling_count,
			freeze_ceiling_amount,
			tnt_export_id
		)
		select
			entity_id,
			prop_val_yr,
			pacs_user_id,
			'0',
			getdate(),
			exmpt_type_cd,
			sum(freeze_assessed) as freeze_assessed,
			sum(freeze_taxable) as freeze_taxable,
			sum(actual_tax) as actual_tax,
			sum(freeze_ceiling_count) as freeze_ceiling_count,
			sum(freeze_ceiling_amount) as freeze_ceiling_amount,
			tnt_export_id
		from
			appraisal_totals_freezes
		where
			pacs_user_id = @input_pacs_user_id
		and	prop_val_yr = @input_yr
		and	tnt_export_id = @input_tnt_export_id
		group by
			entity_id,
			prop_val_yr,
			pacs_user_id,
			exmpt_type_cd,
			tnt_export_id
		
		
		insert into appraisal_totals_transfers
		(
			entity_id,
			prop_val_yr,
			pacs_user_id,
			arb_status,
			date_time,
			exmpt_type_cd,
			transfer_totals,
			transfer_assessed,
			transfer_taxable,
			post_percent_taxable,
			transfer_adjustment,
			transfer_count,
			tnt_export_id
		)
		select
			entity_id,
			prop_val_yr,
			pacs_user_id,
			'0',
			getdate(),
			exmpt_type_cd,
			sum(transfer_totals) as transfer_totals,
			sum(transfer_assessed) as transfer_assessed,
			sum(transfer_taxable) as transfer_taxable,
			sum(post_percent_taxable) as post_percent_taxable,
			sum(transfer_adjustment) as transfer_adjustment,
			sum(transfer_count) as transfer_count,
			tnt_export_id
		from
			appraisal_totals_transfers
		where
			pacs_user_id = @input_pacs_user_id
		and	prop_val_yr = @input_yr
		and	tnt_export_id = @input_tnt_export_id
		group by
			entity_id,
			prop_val_yr,
			pacs_user_id,
			exmpt_type_cd,
			tnt_export_id
	
	
		insert into appraisal_totals_state_cd
		(
			entity_id,
			prop_val_yr,
			pacs_user_id,
			date_time,
			state_cd,
			prop_ct,
			market,
			acres,
			new_val,
			arb_status,
			tnt_export_id
		)
		select
			entity_id,
			prop_val_yr,
			pacs_user_id,
			getdate(),
			state_cd,
			sum(prop_ct) as prop_ct,
			sum(market) as market,
			sum(acres) as acres,
			sum(new_val) as new_val,
			'0',
			tnt_export_id
		from
			appraisal_totals_state_cd
		where
			pacs_user_id = @input_pacs_user_id
		and	prop_val_yr = @input_yr
		and	tnt_export_id = @input_tnt_export_id
		group by
			entity_id,
			prop_val_yr,
			pacs_user_id,
			state_cd,
			tnt_export_id
		
	
		update appraisal_totals_state_cd
		set
			state_cd_desc = ptd_state_code.state_desc
		from
			ptd_state_code with (nolock)
		where
			appraisal_totals_state_cd.pacs_user_id = @input_pacs_user_id
		and	appraisal_totals_state_cd.prop_val_yr = @input_yr
		and	appraisal_totals_state_cd.state_cd = ptd_state_code.state_cd
		and	appraisal_totals_state_cd.tnt_export_id = @input_tnt_export_id
	
		insert into appraisal_totals_cad_state_cd
		(
			entity_id,
			prop_val_yr,
			pacs_user_id,
			date_time,
			state_cd,
			prop_ct,
			market,
			acres,
			new_val,
			arb_status,
			tnt_export_id
		)
		select
			entity_id,
			prop_val_yr,
			pacs_user_id,
			getdate(),
			state_cd,
			sum(prop_ct) as prop_ct,
			sum(market) as market,
			sum(acres) as acres,
			sum(new_val) as new_val,
			'0',
			tnt_export_id
		from
			appraisal_totals_cad_state_cd
		where
			pacs_user_id = @input_pacs_user_id
		and	prop_val_yr = @input_yr
		and	tnt_export_id = @input_tnt_export_id
		group by
			entity_id,
			prop_val_yr,
			pacs_user_id,
			state_cd,
			tnt_export_id


		update appraisal_totals_cad_state_cd
		set
			--appraisal_totals_cad_state_cd.state_cd_desc = psc.state_desc
			state_cd_desc = sc.state_cd_desc
		from appraisal_totals_cad_state_cd
		join state_code as sc with(nolock) on
			appraisal_totals_cad_state_cd.state_cd = sc.state_cd
		join ptd_state_code as psc with(nolock) on
			sc.ptd_state_cd = psc.state_cd
		where
			appraisal_totals_cad_state_cd.pacs_user_id = @input_pacs_user_id and
			appraisal_totals_cad_state_cd.prop_val_yr = @input_yr and
			appraisal_totals_cad_state_cd.tnt_export_id = @input_tnt_export_id


	end

	/*
	 * End subtotals page
	 */

	update appraisal_totals
	set
		tax_rate = isnull(tax_rate.m_n_o_tax_pct,0) + isnull(tax_rate.i_n_s_tax_pct,0)
	from
		tax_rate with (nolock)
	where
		pacs_user_id = @input_pacs_user_id
	and	appraisal_totals.entity_id = tax_rate.entity_id
	and	tax_rate.tax_rate_yr = @input_yr
	and	appraisal_totals.tnt_export_id = @input_tnt_export_id


	if @input_skip_etr_totals = 0
	begin
		exec PopulateETRTables @input_yr, @input_pacs_user_id, @input_tnt_export_id

		insert into appraisal_totals_new_ag
		(
			entity_id,
			prop_val_yr,
			pacs_user_id,
			date_time,
			prop_count,
			last_year_prod_mkt,
			this_year_prod_use,
			value_loss,
			tnt_export_id
		)
		select 
			etr_new_ag.entity_id,
			sup_yr,
			etr_new_ag.pacs_user_id,
			getdate(),
			count(etr_new_ag.prop_id),
			sum(prev_yr_land_market),
			sum(curr_yr_prod_use),
			sum(prev_yr_land_market - curr_yr_prod_use),
			@input_tnt_export_id
		from
			etr_new_ag with (nolock)
		inner join
			appraisal_totals_criteria_entity as ce with (nolock)
		on
			ce.pacs_user_id = @input_pacs_user_id
		and	ce.tnt_export_id = @input_tnt_export_id
		and	etr_new_ag.entity_id = ce.entity_id
		where
			etr_new_ag.sup_yr = @input_yr
		and	etr_new_ag.pacs_user_id = @input_pacs_user_id
		group by
			etr_new_ag.entity_id,
			sup_yr,
			etr_new_ag.pacs_user_id
				
		insert into appraisal_totals_new_annex
		(
			entity_id, 
			prop_val_yr, 
			pacs_user_id, 
			date_time, 
			prop_count, 
			taxable_value, 
			market_value,
			tnt_export_id
		)
		select
			etr_annex_deannex.entity_id, 
			sup_yr, 
			etr_annex_deannex.pacs_user_id, 
			getdate(), 
			count(etr_annex_deannex.prop_id), 
			sum(curr_yr_annex), 
			sum(market),
			@input_tnt_export_id
		from
			etr_annex_deannex with (nolock)
		inner join
			appraisal_totals_criteria_entity as ce with (nolock)
		on
			ce.pacs_user_id = @input_pacs_user_id
		and	ce.tnt_export_id = @input_tnt_export_id
		and	etr_annex_deannex.entity_id = ce.entity_id
		where
			sup_yr = @input_yr
		and	etr_annex_deannex.pacs_user_id = @input_pacs_user_id
		group by
			etr_annex_deannex.entity_id,
			sup_yr,
			etr_annex_deannex.pacs_user_id


--27148
		insert into appraisal_totals_new_deannex
		(
			entity_id, 
			prop_val_yr, 
			pacs_user_id, 
			date_time, 
			prop_count, 
			taxable_value, 
			market_value,
			tnt_export_id
		)
		select
			etr_deannex_rpt.entity_id, 
			sup_yr, 
			etr_deannex_rpt.pacs_user_id, 
			getdate(), 
			count(etr_deannex_rpt.prop_id), 
			sum(prev_yr_deannex), 
			sum(market),
			@input_tnt_export_id
		from
			etr_deannex_rpt with (nolock)
		inner join
			appraisal_totals_criteria_entity as ce with (nolock)
		on
			ce.pacs_user_id = @input_pacs_user_id
		and	ce.tnt_export_id = @input_tnt_export_id
		and	etr_deannex_rpt.entity_id = ce.entity_id
		where
			sup_yr = @input_yr
		and	etr_deannex_rpt.pacs_user_id = @input_pacs_user_id
		group by
			etr_deannex_rpt.entity_id,
			sup_yr,
			etr_deannex_rpt.pacs_user_id



		insert into appraisal_totals_new_ave_hs
		(
			entity_id, 
			prop_val_yr, 
			pacs_user_id,
			date_time,
			hs_count, 
			ave_market, 
			ave_hs_exemption, 
			ave_taxable,
			tnt_export_id
		)
		select
			etr_average_hs.entity_id, 
			sup_yr, 
			etr_average_hs.pacs_user_id, 
			getdate(),
			sum(curr_yr_hs_count), 
			sum(curr_yr_average_market),
			sum(curr_yr_average_hs_exemption), 
			sum(curr_yr_average_taxable),
			@input_tnt_export_id
		from
			etr_average_hs with (nolock)
		inner join
			appraisal_totals_criteria_entity as ce with (nolock)
		on
			ce.pacs_user_id = @input_pacs_user_id
		and	ce.tnt_export_id = @input_tnt_export_id
		and	etr_average_hs.entity_id = ce.entity_id
		where
			sup_yr = @input_yr
		and	etr_average_hs.pacs_user_id = @input_pacs_user_id
		group by
			etr_average_hs.entity_id,
			sup_yr,
			etr_average_hs.pacs_user_id

		insert into appraisal_totals_new_exemptions
		(
			entity_id,
			prop_val_yr,
			pacs_user_id,
			date_time,
			exmpt_type_cd,
			prop_count,
			last_year_absolute_mkt,
			this_year_exmpt_amt,
			value_loss,
			tnt_export_id
		)
		select
			etr_new_ex.entity_id,
			exmpt_tax_yr,
			etr_new_ex.pacs_user_id,
			getdate(),
			exmpt_type_cd,
			count(etr_new_ex.prop_id),
			sum(prev_yr_market),
			sum(curr_yr_exemption_amt),
			sum(prev_yr_market + curr_yr_exemption_amt),
			@input_tnt_export_id
		from
			etr_new_ex with (nolock)
		inner join appraisal_totals_criteria_entity as ce with (nolock)
		on
			ce.pacs_user_id = @input_pacs_user_id
		and	ce.tnt_export_id = @input_tnt_export_id
		and	etr_new_ex.entity_id = ce.entity_id
		where
			exmpt_tax_yr = @input_yr
		and	etr_new_ex.pacs_user_id = @input_pacs_user_id
		group by
			etr_new_ex.entity_id,
			exmpt_tax_yr,
			exmpt_type_cd,
			etr_new_ex.pacs_user_id

		insert into appraisal_totals_new_value
		(
			entity_id,
			prop_val_yr,
			pacs_user_id,
			date_time,
			state_cd,
			prop_count,
			new_taxable_value,
			new_market_value,
			tnt_export_id
		)
		select
			poev.entity_id,
			@input_yr,
			@input_pacs_user_id,
			getdate(),
			'',
			count(poev.prop_id),
			sum(isnull(poev.new_val_taxable,0)) as taxable,
				sum(isnull(poev.new_val_hs,0) + isnull(poev.new_val_nhs,0) + isnull(poev.new_val_p,0)) as market,
				@input_tnt_export_id

		from
			#appraisal_totals_supp_assoc as atsa with (nolock)
		inner join
			appraisal_totals_criteria_entity as ce with (nolock)
		on
			ce.pacs_user_id = @input_pacs_user_id
		and	ce.tnt_export_id = @input_tnt_export_id
		inner join
			prop_owner_entity_val as poev with (nolock)
		on
			poev.sup_yr = @input_yr
		and	poev.sup_num = atsa.sup_num
		and	poev.entity_id = ce.entity_id
		and	poev.prop_id = atsa.prop_id
		inner join
			property_val as pv with (nolock)
		on
			poev.prop_id = pv.prop_id
		and	poev.sup_yr = pv.prop_val_yr
		and	poev.sup_num = pv.sup_num
		and	pv.prop_inactive_dt is null
		left outer join
			property_entity_exemption as pee with (nolock)
		on
			poev.prop_id = pee.prop_id
		and	poev.sup_yr = pee.exmpt_tax_yr
		and poev.sup_yr = pee.owner_tax_yr
		and	poev.sup_num = pee.sup_num
		and	poev.owner_id = pee.owner_id
		and	poev.entity_id = pee.entity_id
		and	pee.exmpt_type_cd = 'ex'
		where
			poev.sup_yr = @input_yr
		group by
			poev.entity_id

		-- protest values
		insert into appraisal_totals_protest_value
		(
			entity_id,
			prop_val_yr,
			pacs_user_id,
			date_time,
			prop_count,
			market,
			protest_value,
			tnt_export_id
		)
		select
			etr_protest_value.entity_id, 
			prop_yr, 
			etr_protest_value.pacs_user_id, 
			getdate(),
			count(*),
			sum(curr_yr_market),
			sum(protest_value),
			@input_tnt_export_id
		from
			etr_protest_value with (nolock)
		inner join
			appraisal_totals_criteria_entity as ce with (nolock)
		on
			ce.pacs_user_id = @input_pacs_user_id
		and	ce.tnt_export_id = @input_tnt_export_id
		and	etr_protest_value.entity_id = ce.entity_id
		where
			prop_yr = @input_yr
		and	etr_protest_value.pacs_user_id = @input_pacs_user_id
		group by
			etr_protest_value.entity_id,
			prop_yr,
			etr_protest_value.pacs_user_id
	end	


	if @input_arb_approved = 0
	begin
		delete from
			appraisal_totals with (tablock)
		where
			pacs_user_id = @input_pacs_user_id
		and	tnt_export_id = @input_tnt_export_id
		and	arb_status = 'C'
	
		delete from
			appraisal_totals_exemptions
		where
			pacs_user_id = @input_pacs_user_id
		and
			tnt_export_id = @input_tnt_export_id
		and	arb_status = 'C'
	
		delete from
			appraisal_totals_freezes
		where
			pacs_user_id = @input_pacs_user_id
		and	tnt_export_id = @input_tnt_export_id
		and	arb_status = 'C'
	
		delete from
			appraisal_totals_transfers
		where
			pacs_user_id = @input_pacs_user_id
		and	tnt_export_id = @input_tnt_export_id
		and	arb_status = 'C'
	
		delete from
			appraisal_totals_state_cd 
		where
			pacs_user_id = @input_pacs_user_id
		and	tnt_export_id = @input_tnt_export_id
		and	arb_status = 'C'

		delete from
			appraisal_totals_cad_state_cd 
		where
			pacs_user_id = @input_pacs_user_id
		and	tnt_export_id = @input_tnt_export_id
		and	arb_status = 'C'
	end

	if @input_under_arb = 0
	begin
		delete from
			appraisal_totals with (tablock)
		where
			pacs_user_id = @input_pacs_user_id
		and	tnt_export_id = @input_tnt_export_id
		and	arb_status = 'A'
	
		delete from
			appraisal_totals_exemptions
		where
			pacs_user_id = @input_pacs_user_id
		and	tnt_export_id = @input_tnt_export_id
		and	arb_status = 'A'
	
		delete from
			appraisal_totals_freezes
		where
			pacs_user_id = @input_pacs_user_id
		and	tnt_export_id = @input_tnt_export_id
		and	arb_status = 'A'
	
		delete from
			appraisal_totals_transfers
		where
			pacs_user_id = @input_pacs_user_id
		and	tnt_export_id = @input_tnt_export_id
		and	arb_status = 'A'
	
		delete from
			appraisal_totals_state_cd 
		where
			pacs_user_id = @input_pacs_user_id
		and	tnt_export_id = @input_tnt_export_id
		and	arb_status = 'A'

		delete from
			appraisal_totals_cad_state_cd 
		where
			pacs_user_id = @input_pacs_user_id
		and	tnt_export_id = @input_tnt_export_id
		and	arb_status = 'A'
	end

	update appraisal_totals
	set
		total_exemption_amount = total_amt
	from
		(
		select
			ate.entity_id,
			ate.arb_status,
			ate.prop_val_yr,
			ate.pacs_user_id,
			ate.tnt_export_id,
			sum(isnull(exempt_local_amt,0) + isnull(exempt_state_amt,0)) as total_amt
		from
			appraisal_totals_exemptions as ate
		inner join
			appraisal_totals as at
		on
			ate.pacs_user_id = at.pacs_user_id
		and	ate.prop_val_yr = at.prop_val_yr
		and	ate.entity_id = at.entity_id
		and	ate.tnt_export_id = at.tnt_export_id
		and	ate.arb_status = at.arb_status
		where
			at.pacs_user_id = @input_pacs_user_id
		and	at.prop_val_yr = @input_yr
		and	at.tnt_export_id = @input_tnt_export_id
		group by
			ate.tnt_export_id,
			ate.pacs_user_id,
			ate.prop_val_yr,
			ate.entity_id,
			ate.arb_status
		) as ate_temp
	where
		appraisal_totals.arb_status = ate_temp.arb_status
	and	appraisal_totals.entity_id = ate_temp.entity_id
	and	appraisal_totals.prop_val_yr = ate_temp.prop_val_yr
	and	appraisal_totals.pacs_user_id = ate_temp.pacs_user_id
	and	appraisal_totals.tnt_export_id = ate_temp.tnt_export_id

	--EricZ; 07/15/2004
	update appraisal_totals
	set
		total_exemption_amount = 0
	where
		total_exemption_amount is null
	
	--Set market_val, appraised_val, assessed_val
	update 	appraisal_totals 
	set	
		market_val = isnull(ag_market,0) + isnull(ag_market_ex,0) + isnull(timber_market,0) + 
			isnull(timber_market_ex,0) + isnull(land_hstd_val,0) + isnull(land_non_hstd_val,0) + 
			isnull(imprv_hstd_val,0) + isnull(imprv_non_hstd_val,0) + isnull(personal_val,0) + 
			isnull(mineral_val,0) + isnull(auto_val,0),
		appraised_val = isnull(ag_market,0) + isnull(ag_market_ex,0) + isnull(timber_market,0) + 
			isnull(timber_market_ex,0) + isnull(land_hstd_val,0) + isnull(land_non_hstd_val,0) + 
			isnull(imprv_hstd_val,0) + isnull(imprv_non_hstd_val,0) + isnull(personal_val,0) + 
			isnull(mineral_val,0) + isnull(auto_val,0) - isnull(productivity_loss,0),
		assessed_val = isnull(ag_market,0) + isnull(ag_market_ex,0) + isnull(timber_market,0) + 
			isnull(timber_market_ex,0) + isnull(land_hstd_val,0) + isnull(land_non_hstd_val,0) + 
			isnull(imprv_hstd_val,0) + isnull(imprv_non_hstd_val,0) + isnull(personal_val,0) + 
			isnull(mineral_val,0) + isnull(auto_val,0) - isnull(productivity_loss,0) - 
			isnull(ten_percent_cap,0)
	where 	prop_val_yr = @input_yr 
	and 	tnt_export_id = @input_tnt_export_id
	and	pacs_user_id = @input_pacs_user_id
	
	--Update taxable_val
	update 	appraisal_totals 
	set	
		taxable_val = isnull(assessed_val,0) - isnull(total_exemption_amount, 0)
	where 	
		prop_val_yr = @input_yr 
	and 	tnt_export_id = @input_tnt_export_id
	and	pacs_user_id = @input_pacs_user_id
	if (isnull(@input_validation_id, -1) <> 0)
	begin
		delete from validation_totals
		where
			pacs_user_id = @input_pacs_user_id
		and	prop_val_yr = @input_yr
		and	tnt_export_id = @input_tnt_export_id
		and	sup_num = @input_sup_num

		insert into validation_totals
		(
			validation_id,
			entity_id,
			prop_val_yr,
			pacs_user_id,
			date_time,
			arb_status,
			prop_count,
			land_hstd_val,
			land_non_hstd_val,
			imprv_hstd_val,
			imprv_non_hstd_val,
			personal_prop_count,
			personal_val,
			mineral_prop_count,
			mineral_val,
			auto_prop_count,
			auto_val,
			ag_market,
			timber_market,
			ag_use,
			timber_use,
			productivity_loss,
			ag_market_ex,
			timber_market_ex,
			ag_use_ex,
			timber_use_ex,
			productivity_loss_ex,
			ten_percent_cap,
			total_exemption_amount,
			tax_rate,
			tax_increment_loss,
			levy_amount,
			weed_taxable_acres,
			tnt_export_id,
			sup_num,
			market_val,
			appraised_val,
			assessed_val,
			taxable_val
		)
		select
			@input_validation_id,
			entity_id,
			prop_val_yr,
			pacs_user_id,
			date_time,
			arb_status,
			prop_count,
			land_hstd_val,
			land_non_hstd_val,
			imprv_hstd_val,
			imprv_non_hstd_val,
			personal_prop_count,
			personal_val,
			mineral_prop_count,
			mineral_val,
			auto_prop_count,
			auto_val,
			ag_market,
			timber_market,
			ag_use,
			timber_use,
			productivity_loss,
			ag_market_ex,
			timber_market_ex,
			ag_use_ex,
			timber_use_ex,
			productivity_loss_ex,
			ten_percent_cap,
			total_exemption_amount,
			tax_rate,
			tax_increment_loss,
			levy_amount,
			weed_taxable_acres,
			tnt_export_id,
			sup_num,
			market_val,
			appraised_val,
			assessed_val,
			taxable_val
		from 
			appraisal_totals
		where
			pacs_user_id = @input_pacs_user_id
		and	prop_val_yr = @input_yr
		and	tnt_export_id = @input_tnt_export_id
		and 	sup_num = @input_sup_num
		and	arb_status = '0'
	end


	set @end_time = getdate()
	set @event_desc = 'Populate Appraisal Totals started at: ' + convert(varchar(10), @start_time, 101)
	set @event_desc = @event_desc + ' ' + convert(varchar(8), @start_time, 108)
	set @event_desc = @event_desc + ' ended at: ' + convert(varchar(10), @end_time, 101)
	set @event_desc = @event_desc + ' ' + convert(varchar(8), @end_time, 108)
	
	exec InsertSystemEvent 'PAT', @event_desc
end

GO

