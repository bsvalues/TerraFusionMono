
create procedure RecalcUpdateIncomeImprovementAssoc
	@szBCPFile varchar(512),
	@lRowsPerUpdate int
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_income_imprv_assoc
		from ''' + @szBCPFile + '''
		with
		(
			maxerrors = 0,
			tablock
		)
	'
	exec(@szSQL)
	set @lBCPRowCount = @@rowcount

	/* Update all rows at once if requested */
	if ( @lRowsPerUpdate = 0 )
	begin
		set @lRowsPerUpdate = @lBCPRowCount
	end

	declare @lMinBCPRowID int
	declare @lMaxBCPRowID int

	set @lMinBCPRowID = 1
	set @lMaxBCPRowID = @lRowsPerUpdate

	while ( @lBCPRowCount > 0 )
	begin
		update income_imprv_assoc
		set
			income_imprv_assoc.value = t.value
		from income_imprv_assoc
		join #recalc_bcp_income_imprv_assoc as t with(nolock) on
			income_imprv_assoc.income_yr = t.income_yr and
			income_imprv_assoc.sup_num = t.sup_num and
			income_imprv_assoc.sale_id = t.sale_id and
			income_imprv_assoc.income_id = t.income_id and
			income_imprv_assoc.prop_id = t.prop_id and
			income_imprv_assoc.imprv_id = t.imprv_id and
			t.lRecalcBCPRowID >= @lMinBCPRowID and t.lRecalcBCPRowID <= @lMaxBCPRowID

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end

GO

