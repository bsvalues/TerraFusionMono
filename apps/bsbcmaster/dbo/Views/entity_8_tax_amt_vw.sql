




CREATE VIEW dbo.entity_8_tax_amt_vw
AS
SELECT levy_group_id, levy_run_id, prop_type_cd, prop_id, 
    owner_id, sup_num, sup_tax_yr, stmnt_id, entity_8_id, 
    entity_8_tax_amt
FROM transfer_tax_stmnt

GO

