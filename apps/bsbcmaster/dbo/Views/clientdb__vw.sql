create view clientdb__vw as 
			select p.*, a.web_suppression, a.confidential_flag, y.certification_dt, 
				case when tmpvw.prop_id is null then 1 else 0 end as all_taxes_paid,
				sale.sale_date,
				ts.township_desc as township, rr.range_desc as Range
			from web_internet_benton.dbo._clientdb_property as p with (nolock)
			join web_internet_benton.dbo._clientdb_pacs_year as y	with (nolock)
			on p.prop_val_yr = y.tax_yr
			join account as a	with (nolock)
			on a.acct_id=p.owner_id
			left outer join (
				select distinct prop_id
				from web_internet_benton.dbo.bill with (nolock)
				where isnull(taxes_paid,0) = 0
			) as tmpvw on tmpvw.prop_id = p.prop_id
			left outer join (
				select sale_date, prop_id 
				from web_internet_benton.dbo._clientdb_deed_history_detail with (nolock) 
				where seq_num = 0
			) as sale on sale.prop_id = p.prop_id
			left join township as ts with (nolock)
			on p.township_code = ts.township_code
			and p.prop_val_yr = ts.township_year
			left join prop_range rr with (nolock)
			on p.range_code = rr.range_code
			and	p.prop_val_yr = rr.range_year
			 LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],
	shape,
	  [Shape].STCentroid().STX as XCoord,
	[Shape].STCentroid().STY as YCoord 
	
		FROM [Benton_spatial_data].[dbo].[parcel]) as coords
			ON p.prop_id = coords.Prop_ID
	where prop_val_yr=(select appr_yr  from pacs_oltp.dbo.pacs_system)
			and
				(a.web_suppression = '0' or a.web_suppression Is Null)

GO

