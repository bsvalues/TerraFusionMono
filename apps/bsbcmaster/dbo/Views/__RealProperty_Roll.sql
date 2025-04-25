

create view [dbo].[__RealProperty_Roll] as
SELECT --DISTINCT 
pv.prop_id, p.geo_id, p.prop_type_cd,
replace(ac.file_as_name, ',', '') as file_as_name, 
ad.addr_line1, ad.addr_line2, ad.addr_line3, ad.addr_city, 
ad.addr_state, ad.addr_zip, 
replace(replace(s.situs_display,',', ''),char(13)+char(10),'') as Situs,
 ta.tax_area_number,
pv.property_use_cd, pv.secondary_use_cd, pv.legal_acreage,
(wpov.imprv_hstd_val + wpov.imprv_non_hstd_val) as Imprv_Mkt_Val,
(wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.timber_market 
	+ wpov.ag_market + wpov.timber_hs_market + wpov.ag_hs_market) as Land_Mkt_Val,
(wpov.new_val_hs + wpov.new_val_nhs) as New_Construction_Value,
wpov.appraised_classified, wpov.appraised_non_classified,
(wpov.appraised_classified + wpov.appraised_non_classified) as Total_Appraised_Value,
(wpov.ag_use_val + wpov.ag_hs_use_val 
	+ wpov.timber_use_val + wpov.timber_hs_use_val) as Current_Use_Value,
wpov.taxable_classified, wpov.taxable_non_classified,
(wpov.taxable_classified + wpov.taxable_non_classified) as Total_Taxable_Value,
dbo.fn_GetExemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) as Exemptions,
wpoe.exempt_qualify_cd, pv.prop_val_yr

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
LEFT OUTER JOIN wash_prop_owner_exemption wpoe WITH (nolock) ON
	pv.prop_id = wpoe.prop_id
	AND pv.prop_val_yr = wpoe.year
	AND pv.sup_num = wpoe.sup_num
	AND o.owner_id = wpoe.owner_id
LEFT OUTER JOIN situs s WITH (nolock) ON 
	pv.prop_id = s.prop_id
	AND isnull(s.primary_situs, 'N') = 'Y'
LEFT OUTER JOIN property_sub_type pst WITH (nolock) ON
	pv.sub_type = pst.property_sub_cd
	
WHERE pv.prop_val_yr = (select appr_yr-1  from pacs_oltp.dbo.pacs_system)
AND pv.prop_inactive_dt is null 
AND p.prop_type_cd in ('R','MH')
--AND p.prop_type_cd not in ('R','MH')
AND isnull(pst.state_assessed_utility, 0) <> 1
AND isnull(pst.local_assessed_utility, 0) <> 1

GO

