
Create view [dbo].[__Pers_Prop_tax yr] as

SELECT DISTINCT pv.prop_id, p.geo_id, ac.file_as_name, 
ad.addr_line1, ad.addr_line2, ad.addr_line3, ad.addr_city, 
ad.addr_state, ad.addr_zip, s.situs_display, ta.tax_area_number,
wpov.appraised_classified 'If populated, this is Farm Asset', wpov.appraised_non_classified,
(wpov.appraised_classified + wpov.appraised_non_classified) as Total_Appraised_Value,
wpov.taxable_classified 'If populated, this is a Farm Asset', wpov.taxable_non_classified,
(wpov.taxable_classified + wpov.taxable_non_classified) as Total_Taxable_Value,
dbo.fn_GetExemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) as Exemptions,
p.dba_name, pv.prop_val_yr
FROM property_val pv WITH (nolock)
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
	pv.prop_id = psa.prop_id 
	AND pv.prop_val_yr = psa.owner_tax_yr
	AND pv.sup_num = psa.sup_num
INNER JOIN property p WITH (nolock) ON 
	pv.prop_id = p.prop_id
INNER JOIN owner o WITH (nolock) ON	
	pv.prop_id = o.prop_id 
	AND pv.prop_val_yr = o.owner_tax_yr 
	AND pv.sup_num = o.sup_num
INNER JOIN account ac WITH (nolock) ON	
	o.owner_id = ac.acct_id 
INNER JOIN address ad WITH (nolock) ON
	ac.acct_id = ad.acct_id
	AND isnull(ad.primary_addr, 'N') = 'Y'
INNER JOIN pers_prop_seg pps WITH (nolock) ON
	pv.prop_id = pps.prop_id
	AND pv.prop_val_yr = pps.prop_val_yr
	AND pv.sup_num = pps.sup_num
	AND pps.sale_id = 0
INNER JOIN wash_prop_owner_tax_area_assoc wta WITH (nolock) ON  
	pv.prop_id = wta.prop_id 
	AND pv.prop_val_yr = wta.year 
	AND pv.sup_num = wta.sup_num
	AND o.owner_id = wta.owner_id
INNER JOIN tax_area ta WITH (nolock) ON  
	wta.tax_area_id = ta.tax_area_id
INNER JOIN wash_prop_owner_val wpov WITH (nolock) ON 
	pv.prop_id = wpov.prop_id 
	AND pv.prop_val_yr = wpov.year 
	AND pv.sup_num = wpov.sup_num
	AND o.owner_id = wpov.owner_id 
LEFT OUTER JOIN situs s WITH (nolock) ON 
	pv.prop_id = s.prop_id
	AND isnull(s.primary_situs, 'N') = 'Y'
LEFT OUTER JOIN property_sub_type pst WITH (nolock) ON
	pv.sub_type = pst.property_sub_cd
WHERE pv.prop_val_yr =(select tax_yr  from pacs_oltp.dbo.pacs_system)
AND pv.prop_inactive_dt is null
AND p.prop_type_cd = 'P'
AND isnull(pst.state_assessed_utility, 0) <> 1
AND isnull(pst.local_assessed_utility, 0) <> 1

GO

