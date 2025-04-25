







CREATE VIEW dbo.transfer_stmnt_entity_exmpt_other_vw
AS
SELECT
	property_entity_exemption.prop_id,
	col_owner_id as owner_id,
	sup_num,
	exmpt_tax_yr,
	entity_id,
	SUM(state_amt + local_amt) AS exmpt_amt
FROM
	property_entity_exemption with (nolock)
	inner join property as p on
	p.prop_id=property_entity_exemption.prop_id
WHERE
	exmpt_type_cd  <> 'OV65'
and	exmpt_type_cd <> 'OV65S'
and	exmpt_type_cd <> 'DP'
and	exmpt_type_cd <> 'HS'
GROUP BY
	property_entity_exemption.prop_id,
	col_owner_id,
	sup_num,
	exmpt_tax_yr,
	entity_id

GO

