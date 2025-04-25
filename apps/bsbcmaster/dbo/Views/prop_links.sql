






create view [dbo].[prop_links] as

SELECT 
pa.child_prop_id AS prop_id,
a.file_as_name AS file_as_name,
CASE WHEN ISNULL(o.hs_prop, 'F') = 'F' THEN 'No' ELSE 'Yes' END AS hs,
CASE 
	WHEN ((s.situs_city Is Null)and(s.situs_state Is Null)) THEN 
		LTRIM(ISNULL(s.situs_num, '') + ' ' + LTRIM(ISNULL(s.situs_street_prefx, '') 
		+ ' ' + LTRIM(ISNULL(s.situs_street, '') + ' ' + ISNULL(s.situs_street_sufix, ''))) + ' ' + ISNULL(s.situs_city, '') + ' ' + ISNULL(s.situs_state, '') 
		+ ' ' + ISNULL(s.situs_zip, '')) 
	WHEN (s.situs_city Is Null) THEN 
		LTRIM(ISNULL(s.situs_num, '') + ' ' + LTRIM(ISNULL(s.situs_street_prefx, '') 
		+ ' ' + LTRIM(ISNULL(s.situs_street, '') + ' ' + ISNULL(s.situs_street_sufix, ''))) + ' ' + ISNULL(s.situs_state, '') 
		+ ' ' + ISNULL(s.situs_zip, '')) 
	WHEN (s.situs_state Is Null) THEN 
		LTRIM(ISNULL(s.situs_num, '') + ' ' + LTRIM(ISNULL(s.situs_street_prefx, '') 
		+ ' ' + LTRIM(ISNULL(s.situs_street, '') + ' ' + ISNULL(s.situs_street_sufix, ''))) + ' ' + ISNULL(s.situs_city, '') 
		+ ' ' + ISNULL(s.situs_zip, '')) 
	else
		LTRIM(ISNULL(s.situs_num, '') + ' ' + LTRIM(ISNULL(s.situs_street_prefx, '') 
		+ ' ' + LTRIM(ISNULL(s.situs_street, '') + ' ' + ISNULL(s.situs_street_sufix, ''))) + ' ' + ISNULL(s.situs_city, '') + ', ' + ISNULL(s.situs_state, '') 
		+ ' ' + ISNULL(s.situs_zip, '')) 
end situs_address,
pv.legal_desc, p.geo_id, pv.market, pa.parent_prop_id, pv.prop_inactive_dt
AS complete,
pa.lOrder,
p.dba_name
,sp.Shape,sp.CENTROID_X as xcoord
,sp.CENTROID_Y as ycoord
FROM dbo.property_assoc pa
LEFT OUTER JOIN dbo.split_merge_prop_assoc pg ON
	pa.child_prop_id = pg.prop_id
INNER JOIN dbo.pacs_system ps ON
	0 = 0
LEFT OUTER JOIN dbo.situs s ON
	s.prop_id = pa.child_prop_id AND
	primary_situs = 'Y'
INNER JOIN dbo.owner o ON
	o.prop_id = pa.child_prop_id AND
	o.owner_tax_yr = ps.appr_yr
INNER JOIN dbo.account a ON
	a.acct_id = o.owner_id
INNER JOIN dbo.property p ON
	p.prop_id = pa.child_prop_id
INNER JOIN dbo.prop_supp_assoc psa ON
	pa.child_prop_id = psa.prop_id AND ps.appr_yr = psa.owner_tax_yr
INNER JOIN dbo.property_val pv ON
	pa.child_prop_id = pv.prop_id AND
	ps.appr_yr = pv.prop_val_yr AND
	psa.sup_num = pv.sup_num AND 
	(pv.prop_inactive_dt IS NULL or pv.udi_parent = 'T')
inner join 
(select CENTROID_X,CENTROID_Y,shape,prop_id
from Benton_spatial_data.dbo.parcel)as sp on p.prop_id=sp.prop_id


--ORDER BY pa.parent_prop_id asc, pa.lOrder asc

GO

