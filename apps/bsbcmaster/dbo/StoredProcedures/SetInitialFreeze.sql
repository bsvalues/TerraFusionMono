
create procedure dbo.SetInitialFreeze

@input_tax_yr		numeric(4),
@input_pacs_user_id	int,
@input_production_mode	bit = 0

as


declare @prop_id     		int
declare @owner_tax_yr 		numeric(4)
declare @sup_num     		int		
declare @land_hstd_val    	numeric(14)
declare @imprv_hstd_val   	numeric(14)
declare @new_val_hs		numeric(14)
declare @ten_percent_cap	numeric(14)
declare @entity_id   		int
declare @owner_id    		int
declare @exmpt_type_cd 		char(5)
declare @use_freeze 		char(1)
declare @transfer_dt            datetime     	
declare @transfer_pct		numeric(9,6)
declare @qualify_yr		numeric(4)

declare @m_n_o_tax_pct   	numeric(13,10)
declare @i_n_s_tax_pct		numeric(13,10)

declare @tax_amt		numeric(14,2)
declare @prev_tax_amt		numeric(14,2)

declare @exemption_amt		numeric(14,2)
declare @hs_exmpt_amt		numeric(14,2)

declare @new_val_tax_amt	numeric(14,2)

declare @poev_frz_assessed	numeric(14,0)
declare @poev_frz_taxable	numeric(14,0)

delete from update_freeze

declare PROPERTY scroll cursor
for
select
	psa.prop_id, 
	psa.owner_tax_yr,
	psa.sup_num,
	isnull(poev.land_hstd_val, 0),
	isnull(poev.imprv_hstd_val, 0),
	isnull(poev.new_val_hs, 0),
	epa.entity_id, 
	pe.owner_id, 
	pe.exmpt_type_cd, 
	pf.use_freeze, 
	prev_pf.transfer_dt, 
	prev_pf.transfer_pct, 
	isnull(poev.ten_percent_cap, 0),
	tr.m_n_o_tax_pct,
	tr.i_n_s_tax_pct, 
	pe.qualify_yr
from
	entity_prop_assoc as epa with (nolock)
inner join
	prop_supp_assoc as psa with (nolock)
on 
	epa.prop_id = psa.prop_id
and	epa.tax_yr = psa.owner_tax_yr
and	epa.sup_num = psa.sup_num
inner join
	property_val as pv with (nolock)
on
	psa.prop_id = pv.prop_id
and	psa.owner_tax_yr = pv.prop_val_yr
and	psa.sup_num = pv.sup_num
and	pv.prop_inactive_dt is null
inner join
	prop_supp_assoc as prev_psa with (nolock)
on
	psa.prop_id = prev_psa.prop_id
and	(psa.owner_tax_yr - 1) = prev_psa.owner_tax_yr
inner join
	prop_owner_entity_val as poev with (nolock)
on
	prev_psa.prop_id  = poev.prop_id
and	epa.entity_id = poev.entity_id
and	prev_psa.owner_tax_yr = poev.sup_yr
and	prev_psa.sup_num = poev.sup_num
inner join
	tax_rate as tr with (nolock)
on
	poev.entity_id = tr.entity_id
and	poev.sup_yr = tr.tax_rate_yr
inner join
	owner as o with (nolock)
on
	psa.prop_id = o.prop_id
and	poev.owner_id = o.owner_id
and	psa.owner_tax_yr = o.owner_tax_yr
and	psa.sup_num = o.sup_num
inner join
	property_exemption as pe with (nolock)
on 
	o.prop_id = pe.prop_id
and	o.owner_id = pe.owner_id
and	o.owner_tax_yr = pe.owner_tax_yr
and	o.owner_tax_yr = pe.exmpt_tax_yr
and	o.sup_num = pe.sup_num
and	isnull(pe.qualify_yr, 0) < @input_tax_yr
inner join
	entity_exmpt as ee with (nolock)
on
	epa.entity_id = ee.entity_id
and	pe.exmpt_type_cd = ee.exmpt_type_cd
and	pe.exmpt_tax_yr = ee.exmpt_tax_yr
and	pe.owner_tax_yr = ee.exmpt_tax_yr
and	ee.freeze_flag = 1
and	ee.set_initial_freeze_date is null
join
	entity as e with (nolock)
on
	ee.entity_id = e.entity_id
and	e.entity_type_cd <> 'S'
left outer join
	property_freeze as pf with (nolock)
on
	pe.prop_id = pf.prop_id
and	pe.owner_id = pf.owner_id
and	pe.owner_tax_yr = pf.owner_tax_yr
and	pe.exmpt_tax_yr = pf.exmpt_tax_yr
and	pe.sup_num = pf.sup_num
and	pe.exmpt_type_cd = pf.exmpt_type_cd
and	epa.entity_id = pf.entity_id

left outer join
	property_freeze as prev_pf with (nolock)
on
	poev.prop_id = prev_pf.prop_id
and	poev.owner_id = prev_pf.owner_id
and	poev.sup_yr = prev_pf.owner_tax_yr
and	poev.sup_yr = prev_pf.exmpt_tax_yr
and	poev.sup_num = prev_pf.sup_num
and	pe.exmpt_type_cd = prev_pf.exmpt_type_cd
and	epa.entity_id = prev_pf.entity_id
--RK 12012005 and	epa.entity_id = pf.entity_id

where
	epa.tax_yr = @input_tax_yr

declare @run_id int
set @run_id = 0

exec dbo.GetUniqueID 'update_freeze', @run_id output, 1, 0


open PROPERTY

fetch next from PROPERTY
into
	@prop_id,     
	@owner_tax_yr, 
	@sup_num,     
	@land_hstd_val,    
	@imprv_hstd_val,
	@new_val_hs,  
	@entity_id,   
	@owner_id,    
	@exmpt_type_cd, 
	@use_freeze, 
	@transfer_dt,                 
	@transfer_pct,
	@ten_percent_cap,
	@m_n_o_tax_pct,
	@i_n_s_tax_pct,
	@qualify_yr


while (@@fetch_status = 0)
begin
	select
		@exemption_amt = sum(pee.local_amt + pee.state_amt)
	from
		property_entity_exemption as pee with (nolock)
	join
		prop_supp_assoc as psa with (nolock)
	on
		pee.prop_id = psa.prop_id
	and	pee.owner_tax_yr = psa.owner_tax_yr
	and	pee.exmpt_tax_yr = psa.owner_tax_yr
	and	pee.sup_num = psa.sup_num
	where
		pee.prop_id = @prop_id
	and	pee.owner_id = @owner_id
	and	pee.entity_id = @entity_id
	and	pee.owner_tax_yr = (@owner_tax_yr - 1)
	and	pee.exmpt_tax_yr = (@owner_tax_yr - 1)

	set @exemption_amt = isnull(@exemption_amt, 0)


	if (((@imprv_hstd_val + @land_hstd_val - @ten_percent_cap) - @exemption_amt) < 0)
	begin
		select @hs_exmpt_amt = (@imprv_hstd_val + @land_hstd_val - @ten_percent_cap)
	end
	else
	begin
		select @hs_exmpt_amt = @exemption_amt
	end


	set @tax_amt = ((@imprv_hstd_val + @land_hstd_val - @ten_percent_cap) - @hs_exmpt_amt) / 100 * (@m_n_o_tax_pct + @i_n_s_tax_pct)

	if (@tax_amt < 0)
	begin
		set @tax_amt = 0
	end

	if (@transfer_dt is not null and @transfer_pct is not null)
	begin
		set @tax_amt = @tax_amt * (@transfer_pct / 100)
	end

	if (isnull(@use_freeze, 'F') = 'F')
	begin
		insert into update_freeze
		(
			prop_id,
			owner_id,
			entity_id,
			sup_num,
			prop_val_yr,
			tax_amt,
			prev_tax_amt,
			poev_assessed,
			poev_taxable,
			exmpt_type_cd,
			pacs_run_id
		)
		select
			@prop_id,
			@owner_id,
			@entity_id,
			@sup_num,
			@owner_tax_yr,
			@tax_amt,
			NULL,
			0,
			0,
			@exmpt_type_cd,
			@run_id
	end

	FETCH NEXT FROM PROPERTY
	into
		@prop_id,     
		@owner_tax_yr, 
		@sup_num,     
		@land_hstd_val,    
		@imprv_hstd_val,
		@new_val_hs,  
		@entity_id,   
		@owner_id,    
		@exmpt_type_cd, 
		@use_freeze, 
		@transfer_dt,                 
		@transfer_pct,
		@ten_percent_cap,
		@m_n_o_tax_pct,
		@i_n_s_tax_pct,
		@qualify_yr
end


CLOSE PROPERTY
DEALLOCATE PROPERTY

if (@input_production_mode = 1)
begin
	-- insert the new freeze or update the existing freeze
	declare UPDATEFREEZE scroll cursor
	for
	select
		prop_id,
		owner_id,
		entity_id,
		sup_num,
		prop_val_yr,
		tax_amt,
		prev_tax_amt,
		poev_assessed,
		poev_taxable,
		exmpt_type_cd,
		pacs_run_id
	from
		update_freeze with (nolock)

	open UPDATEFREEZE
	fetch next from UPDATEFREEZE into
		@prop_id,
		@owner_id,
		@entity_id,
		@sup_num,
		@owner_tax_yr,
		@tax_amt,
		@prev_tax_amt,
		@poev_frz_assessed,
		@poev_frz_taxable,
		@exmpt_type_cd,
		@run_id

	while (@@fetch_status = 0)
	begin
		if exists
		(
			select
				*
			from
				property_freeze with (nolock)
			where
				prop_id = @prop_id
			and	owner_id = @owner_id
			and	owner_tax_yr = @owner_tax_yr
			and	exmpt_tax_yr = @owner_tax_yr
			and	sup_num = @sup_num
			and	entity_id = @entity_id
			and	exmpt_type_cd = @exmpt_type_cd
		)
		begin
			update
				property_freeze
			set
				freeze_ceiling = @tax_amt,
				freeze_yr = case when isnull(freeze_yr, -1) <= 0 then (@input_tax_yr - 1) else freeze_yr end,
				use_freeze = 'T',
				pacs_freeze = 'T',
				pacs_freeze_date = GetDate(),
				pacs_freeze_ceiling = @tax_amt,
				pacs_freeze_run = @run_id
			where
				prop_id = @prop_id
			and	owner_id = @owner_id
			and	owner_tax_yr = @owner_tax_yr
			and	exmpt_tax_yr = @owner_tax_yr
			and	sup_num = @sup_num
			and	entity_id = @entity_id
			and	exmpt_type_cd = @exmpt_type_cd
		end
		else
		begin
			if not exists
			(
				select
					*
				from
					property_freeze with (nolock)
				where
					prop_id = @prop_id
				and	owner_id = @owner_id
				and	owner_tax_yr = @owner_tax_yr
				and	exmpt_tax_yr = @owner_tax_yr
				and	sup_num = @sup_num
				and	entity_id = @entity_id
			)
			begin
				insert into property_freeze
				(
					prop_id,
					owner_id,
					owner_tax_yr,
					exmpt_tax_yr,
					sup_num,
					entity_id,
					exmpt_type_cd,
					use_freeze,
					freeze_ceiling,
					freeze_yr,
					pacs_freeze,
					pacs_freeze_date,
					pacs_freeze_ceiling,
					pacs_freeze_run,
					freeze_override
				)
				values
				(
					@prop_id,
					@owner_id,
					@owner_tax_yr,
					@owner_tax_yr,
					@sup_num,
					@entity_id,
					@exmpt_type_cd,
					'T',
					@tax_amt,
					(@input_tax_yr - 1),
					'T',
					GetDate(),
					@tax_amt,
					@run_id,
					0
				)
			end
		end

		declare @freeze_type varchar(5)
		set @freeze_type = replace(@exmpt_type_cd, 'OV65S', 'OV65')
		
		update
			prop_owner_entity_val
		set
			freeze_type = @freeze_type,
			freeze_ceiling = @tax_amt,
			freeze_yr = pf.freeze_yr,
			frz_taxable_val = isnull(@poev_frz_taxable, 0),
			frz_assessed_val = isnull(@poev_frz_assessed, 0),
			transfer_flag = 'F',
			transfer_pct = 0,
			transfer_freeze_assessed = 0,
			transfer_freeze_taxable = 0,
			transfer_entity_taxable = 0,
			transfer_taxable_adjustment = 0
		from
			prop_owner_entity_val as poev with (nolock)
		join
			property_freeze as pf with (nolock)
		on
			poev.prop_id = pf.prop_id
		and	poev.owner_id = pf.owner_id
		and	poev.entity_id = pf.entity_id
		and	poev.sup_yr = pf.exmpt_tax_yr
		and	poev.sup_yr = pf.owner_tax_yr
		and	poev.sup_num = pf.sup_num
		and	pf.exmpt_type_cd = @exmpt_type_cd
		and	pf.use_freeze = 'T'
		where
			poev.prop_id = @prop_id
		and	poev.owner_id = @owner_id
		and	poev.entity_id = @entity_id
		and	poev.sup_yr = @owner_tax_yr
		and	poev.sup_num = @sup_num

		fetch next from UPDATEFREEZE into
			@prop_id,
			@owner_id,
			@entity_id,
			@sup_num,
			@owner_tax_yr,
			@tax_amt,
			@prev_tax_amt,
			@poev_frz_assessed,
			@poev_frz_taxable,
			@exmpt_type_cd,
			@run_id
	end

	close UPDATEFREEZE
	deallocate UPDATEFREEZE
	
	update
		property_exemption
	set
		qualify_yr =
			case when isnull(min_freeze_yr.freeze_yr, 9999) < isnull(min_exmpt_tax_yr.exmpt_tax_yr, 9999)
				then min_freeze_yr.freeze_yr
				else min_exmpt_tax_yr.exmpt_tax_yr
			end
	from
		property_exemption as pe with (nolock)
	inner join
	(
		select distinct
			pf.prop_id as prop_id,
			pf.owner_id as owner_id,
			pf.owner_tax_yr as owner_tax_yr,
			pf.exmpt_tax_yr as exmpt_tax_yr,
			pf.sup_num as sup_num,
			pf.exmpt_type_cd as exmpt_type_cd
		from
			property_freeze as pf with (nolock)
		where
			pacs_freeze_run = @run_id
	) as pacs_freeze_run
	on
		pe.prop_id = pacs_freeze_run.prop_id
	and	pe.owner_id = pacs_freeze_run.owner_id
	and	pe.owner_tax_yr = pacs_freeze_run.owner_tax_yr
	and	pe.exmpt_tax_yr = pacs_freeze_run.exmpt_tax_yr
	and	pe.sup_num = pacs_freeze_run.sup_num
	and	pe.exmpt_type_cd = pacs_freeze_run.exmpt_type_cd
	inner join
	(
		select
			pf.prop_id as prop_id,
			pf.owner_id as owner_id,
			pf.owner_tax_yr as owner_tax_yr,
			pf.exmpt_tax_yr as exmpt_tax_yr,
			pf.sup_num as sup_num,
			pf.exmpt_type_cd as exmpt_type_cd,
			min(isnull(pf.freeze_yr, 9999)) as freeze_yr
		from
			property_freeze as pf with (nolock)
		inner join
			property_exemption as pe with (nolock)
		on
			pf.prop_id = pe.prop_id
		and	pf.owner_id = pe.owner_id
		and	pf.owner_tax_yr = pe.owner_tax_yr
		and	pf.exmpt_tax_yr = pe.exmpt_tax_yr
		and	pf.sup_num = pe.sup_num
		and	pf.exmpt_type_cd = pe.exmpt_type_cd
		inner join
			prop_supp_assoc as psa with (nolock)
		on
			pe.prop_id = psa.prop_id
		and	pe.owner_tax_yr = psa.owner_tax_yr
		and	pe.exmpt_tax_yr = psa.owner_tax_yr
		and	pe.sup_num = psa.sup_num
		inner join
			property_val as pv with (nolock)
		on
			psa.prop_id = pv.prop_id
		and	psa.owner_tax_yr = pv.prop_val_yr
		and	psa.sup_num = pv.sup_num
		and	pv.prop_inactive_dt is null
		group by
			pf.prop_id,
			pf.owner_id,
			pf.owner_tax_yr,
			pf.exmpt_tax_yr,
			pf.sup_num,
			pf.exmpt_type_cd
	) as min_freeze_yr
	on
		pacs_freeze_run.prop_id = min_freeze_yr.prop_id
	and	pacs_freeze_run.owner_id = min_freeze_yr.owner_id
	and	pacs_freeze_run.owner_tax_yr = min_freeze_yr.owner_tax_yr
	and	pacs_freeze_run.exmpt_tax_yr = min_freeze_yr.exmpt_tax_yr
	and	pacs_freeze_run.sup_num = min_freeze_yr.sup_num
	and	pacs_freeze_run.exmpt_type_cd = min_freeze_yr.exmpt_type_cd
	inner join
	(
		select
			pe.prop_id as prop_id,
			pe.owner_id as owner_id,
			pe.exmpt_type_cd as exmpt_type_cd,
			min(pe.exmpt_tax_yr) as exmpt_tax_yr
		from
			property_exemption as pe with (nolock)
		inner join
			prop_supp_assoc as psa with (nolock)
		on
			pe.prop_id = psa.prop_id
		and	pe.owner_tax_yr = psa.owner_tax_yr
		and	pe.exmpt_tax_yr = psa.owner_tax_yr
		and	pe.sup_num = psa.sup_num
		inner join
			property_val as pv with (nolock)
		on
			psa.prop_id = pv.prop_id
		and	psa.owner_tax_yr = pv.prop_val_yr
		and	psa.sup_num = pv.sup_num
		and	pv.prop_inactive_dt is null
		group by
			pe.prop_id,
			pe.owner_id,
			pe.exmpt_type_cd
	) as min_exmpt_tax_yr
	on
		min_freeze_yr.prop_id = min_exmpt_tax_yr.prop_id
	and	min_freeze_yr.owner_id = min_exmpt_tax_yr.owner_id
	and	min_freeze_yr.exmpt_type_cd = min_exmpt_tax_yr.exmpt_type_cd
	where
		pe.owner_tax_yr = @input_tax_yr
	and	pe.exmpt_tax_yr = @input_tax_yr
	and	pe.qualify_yr is null



	update
		entity_exmpt
	set
		set_initial_freeze_date = GetDate(),
		set_initial_freeze_user_id = @input_pacs_user_id
	where
		set_initial_freeze_date is null
	and	exmpt_tax_yr = @input_tax_yr
	and	freeze_flag = 1
end

GO

