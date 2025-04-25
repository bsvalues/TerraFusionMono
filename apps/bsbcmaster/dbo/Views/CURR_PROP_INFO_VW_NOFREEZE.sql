


CREATE VIEW dbo.CURR_PROP_INFO_VW_NOFREEZE
AS
SELECT
	property_val.prop_id,
	property_val.sup_num,
	property_val.prop_val_yr,
	property_val.land_hstd_val,
	property_val.land_non_hstd_val,
	property_val.imprv_hstd_val,
	property_val.imprv_non_hstd_val,
	property_val.appraised_val,
	property_val.assessed_val,
	property_val.market,
	property_val.ag_use_val,
	property_val.ag_market,
	property_val.ag_loss,
	property_val.ag_late_loss,
	property_val.timber_78,
	property_val.timber_market,
	property_val.timber_use,
	property_val.timber_loss,
	property_val.timber_late_loss,
	property_val.legal_desc,
	property_val.legal_desc_2,
	property_val.legal_acreage,
	owner.owner_id,
	owner.pct_ownership,
	account.file_as_name,
	address.addr_line1,
	address.addr_line2,
	address.addr_line3,
	address.addr_city,
	address.addr_state,
	address.addr_zip,
	address.country_cd,
	address.primary_addr,
	address.is_international,
	prop_supp_assoc.owner_tax_yr,
	prop_supp_assoc.sup_num AS Expr1,
	owner.roll_exemption,
	owner.roll_state_code,
	property_val.prop_inactive_dt,
	property.prop_type_cd,
	property.geo_id,
	owner.roll_entity,
	property.ref_id1,
	property.ref_id2,
	property_val.eff_size_acres,
	property_val.map_id,
	property_val.ten_percent_cap
FROM
	account
INNER JOIN
	owner
ON
	account.acct_id = owner.owner_id
INNER JOIN
	property_val
INNER JOIN
	prop_supp_assoc
ON
	property_val.prop_id = prop_supp_assoc.prop_id
AND	property_val.sup_num = prop_supp_assoc.sup_num
AND	property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr
ON
	owner.prop_id = prop_supp_assoc.prop_id
AND	owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr
AND	owner.sup_num = prop_supp_assoc.sup_num
INNER JOIN
	property
ON
	prop_supp_assoc.prop_id = property.prop_id
LEFT OUTER JOIN
	address
ON
	owner.owner_id = address.acct_id
WHERE
	prop_supp_assoc.owner_tax_yr IN
        (
	SELECT
		MAX(owner_tax_yr)
	FROM
		prop_supp_assoc AS psa
	WHERE
		psa.prop_id = property_val.prop_id
	)
AND	address.primary_addr = 'Y'

GO

