
create procedure WACalcTaxableInsertAssocTaxArea
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lPacsUserID int
as

set nocount on

	if ( @lPacsUserID <> 0 )
	begin
		insert wash_prop_owner_tax_area_assoc (
			year, sup_num, prop_id, owner_id, tax_area_id, pending
		)
		select
			wpov.year, wpov.sup_num, wpov.prop_id, wpov.owner_id, pta.tax_area_id, 0
		from wash_prop_owner_val as wpov with(nolock)
		join #taxable_property_list as tpl with(nolock) on
			tpl.year = wpov.year and
			tpl.sup_num = wpov.sup_num and
			tpl.prop_id = wpov.prop_id
		join property_tax_area as pta with(nolock) on
			pta.year = wpov.year and
			pta.sup_num = wpov.sup_num and
			pta.prop_id = wpov.prop_id
		order by 1, 2, 3, 4, 5

		insert wash_prop_owner_tax_area_assoc (
			year, sup_num, prop_id, owner_id, tax_area_id, pending
		)
		select
			wpov.year, wpov.sup_num, wpov.prop_id, wpov.owner_id, pta.tax_area_id_pending, 1
		from wash_prop_owner_val as wpov with(nolock)
		join #taxable_property_list as tpl with(nolock) on
			tpl.year = wpov.year and
			tpl.sup_num = wpov.sup_num and
			tpl.prop_id = wpov.prop_id
		join property_tax_area as pta with(nolock) on
			pta.year = wpov.year and
			pta.sup_num = wpov.sup_num and
			pta.prop_id = wpov.prop_id and
			pta.tax_area_id_pending > 0
		order by 1, 2, 3, 4, 5
	end
	else if ( @lPropID <> 0 )
	begin
		insert wash_prop_owner_tax_area_assoc (
			year, sup_num, prop_id, owner_id, tax_area_id, pending
		)
		select
			wpov.year, wpov.sup_num, wpov.prop_id, wpov.owner_id, pta.tax_area_id, 0
		from wash_prop_owner_val as wpov with(nolock)
		join property_tax_area as pta with(nolock) on
			pta.year = wpov.year and
			pta.sup_num = wpov.sup_num and
			pta.prop_id = wpov.prop_id
		where
			wpov.year = @lYear and
			wpov.sup_num = @lSupNum and
			wpov.prop_id = @lPropID
		order by 1, 2, 3, 4, 5

		insert wash_prop_owner_tax_area_assoc (
			year, sup_num, prop_id, owner_id, tax_area_id, pending
		)
		select
			wpov.year, wpov.sup_num, wpov.prop_id, wpov.owner_id, pta.tax_area_id_pending, 1
		from wash_prop_owner_val as wpov with(nolock)
		join property_tax_area as pta with(nolock) on
			pta.year = wpov.year and
			pta.sup_num = wpov.sup_num and
			pta.prop_id = wpov.prop_id and
			pta.tax_area_id_pending > 0
		where
			wpov.year = @lYear and
			wpov.sup_num = @lSupNum and
			wpov.prop_id = @lPropID
		order by 1, 2, 3, 4, 5
	end
	else
	begin
		insert wash_prop_owner_tax_area_assoc with(tablockx) (
			year, sup_num, prop_id, owner_id, tax_area_id, pending
		)
		select
			wpov.year, wpov.sup_num, wpov.prop_id, wpov.owner_id, pta.tax_area_id, 0
		from wash_prop_owner_val as wpov with(nolock)
		join property_tax_area as pta with(nolock) on
			pta.year = wpov.year and
			pta.sup_num = wpov.sup_num and
			pta.prop_id = wpov.prop_id
		where
			wpov.year = @lYear and
			wpov.sup_num = @lSupNum
		order by 1, 2, 3, 4, 5

		insert wash_prop_owner_tax_area_assoc with(tablockx) (
			year, sup_num, prop_id, owner_id, tax_area_id, pending
		)
		select
			wpov.year, wpov.sup_num, wpov.prop_id, wpov.owner_id, pta.tax_area_id_pending, 1
		from wash_prop_owner_val as wpov with(nolock)
		join property_tax_area as pta with(nolock) on
			pta.year = wpov.year and
			pta.sup_num = wpov.sup_num and
			pta.prop_id = wpov.prop_id and
			pta.tax_area_id_pending > 0
		where
			wpov.year = @lYear and
			wpov.sup_num = @lSupNum
		order by 1, 2, 3, 4, 5
	end

GO

