




CREATE PROCEDURE LevyRollReportEntityInfo
	@input_prop_id int,
	@input_owner_id int,
	@input_year int,
	@input_sup_num int,
	@input_entity_ids varchar(200)
AS

declare @strSQL varchar(3000)

set @strSQL = 'SET NOCOUNT ON '
set @strSQL = @strSQL + 'SELECT	1 as DumbID, '
set @strSQL = @strSQL + 'entity.entity_cd, '
set @strSQL = @strSQL + 'account.file_as_name, '
set @strSQL = @strSQL + 'epa.entity_prop_id as xref_id, '
set @strSQL = @strSQL + 'bill.stmnt_id, '
set @strSQL = @strSQL + 'bill.bill_late_ag_penalty, '
set @strSQL = @strSQL + 'poev.assessed_val, '
set @strSQL = @strSQL + 'poev.assessed_val - poev.taxable_val as exemption_val, '
set @strSQL = @strSQL + 'poev.taxable_val, '
set @strSQL = @strSQL + 'tax_rate.m_n_o_tax_pct + tax_rate.i_n_s_tax_pct + tax_rate.prot_i_n_s_tax_pct as tax_rate, '
set @strSQL = @strSQL + 'isnull(bill.bill_m_n_o, 0) + isnull(bill.bill_i_n_s, 0) + isnull(bill.bill_prot_i_n_s, 0) as levy_tax, '

set @strSQL = @strSQL + 'poev.freeze_type, '
set @strSQL = @strSQL + 'poev.freeze_ceiling, '
set @strSQL = @strSQL + 'poev.freeze_yr '

set @strSQL = @strSQL + 'FROM 	prop_owner_entity_val as poev '

set @strSQL = @strSQL + 'INNER JOIN entity '
set @strSQL = @strSQL + 'ON    poev.entity_id = entity.entity_id '

set @strSQL = @strSQL + 'INNER JOIN entity_prop_assoc as epa '
set @strSQL = @strSQL + 'ON    poev.entity_id = epa.entity_id '
set @strSQL = @strSQL + 'AND   poev.prop_id = epa.prop_id '
set @strSQL = @strSQL + 'AND   poev.sup_num = epa.sup_num '
set @strSQL = @strSQL + 'AND   poev.sup_yr = epa.tax_yr '

set @strSQL = @strSQL + 'INNER JOIN account '
set @strSQL = @strSQL + 'ON    entity.entity_id = account.acct_id '

set @strSQL = @strSQL + 'INNER JOIN bill '
set @strSQL = @strSQL + 'ON    poev.prop_id = bill.prop_id '
-- set @strSQL = @strSQL + 'AND   poev.owner_id = bill.owner_id '
--set @strSQL = @strSQL + 'AND   poev.sup_num = bill.sup_num '			
set @strSQL = @strSQL + 'AND   poev.sup_yr = bill.sup_tax_yr '
set @strSQL = @strSQL + 'AND   poev.entity_id = bill.entity_id '

set @strSQL = @strSQL + 'INNER JOIN tax_rate '
set @strSQL = @strSQL + 'ON	poev.entity_id = tax_rate.entity_id '
set @strSQL = @strSQL + 'AND	poev.sup_yr = tax_rate.tax_rate_yr '

set @strSQL = @strSQL + 'WHERE 	poev.prop_id = ' + CONVERT(varchar(12), @input_prop_id) + ' '
set @strSQL = @strSQL + 'AND	poev.owner_id = ' + CONVERT(varchar(12), @input_owner_id) + ' '
set @strSQL = @strSQL + 'AND	poev.sup_yr = ' + CONVERT(varchar(4), @input_year) + ' '
set @strSQL = @strSQL + 'AND	poev.sup_num = ' + CONVERT(varchar(5), @input_sup_num) + ' '

if @input_entity_ids <> ''
begin
	set @strSQL = @strSQL + 'AND	poev.entity_id IN (' + @input_entity_ids + ')'
end

exec(@strSQL)

GO

