--create view __ApprEst_ag as 
--create view __ApprEst_Comm_13 as
--create view __ApprEst_Residential as
--create view __BCApprEst_1 as
--create view __appr_sales
--create view __apprest_all 
create view __Apprest_Indust as

SELECT DISTINCT 
	pv.prop_id																							as ParcelID,  
	rtrim(property.geo_id)																				as MapNumber, 
	pv.prop_id																							as prop_id, 
	situs.situs_display																					as situs_display, 
	pv.hood_cd																							as neighborhood, 
	pv.subset_cd																						as subset,
	rtrim(replace(pv.cycle, char(13) + char(10), ''))													as Reval,
	ta.tax_area_description																				as tax_area,
	rtrim(replace(abs_subdv.abs_subdv_desc, char(13) + char(10), ''))									as abs_subdv_desc,
	rtrim(pp.property_use_cd)																			as property_use_cd,
	rtrim(property.prop_type_cd)																		as prop_type_cd, 
	rtrim(imprv_fix.imprv_type_cd)																		as PrimaryImprovement,
	imprv_fix.stories																					as stories, 
	imprv_fix.num_imprv																					as num_imprv, 
	pp.living_area																												as TotalArea, 
	sum_imprv_areas.finished_basement																							as finished_basement,
	sum_imprv_areas.unfinished_basement																							as unfinished_basement,
	CAST(ISNULL(sum_imprv_areas.finished_basement, 0) + ISNULL(sum_imprv_areas.unfinished_basement, 0) AS numeric(18, 0))		as Total_Basement,
	rtrim(imprv_fix.actual_year_built)																	as YearBuilt, 
	pp.actual_age																						as Age,
	rtrim(pp.class_cd)																					as class_cd,
	rtrim(pp.class_cd) + ' ' + rtrim(pp.imprv_det_sub_class_cd)											as class_subclass_cd,
	rtrim(pp.condition_cd)																				as Condition,
	[imprv_det_desc]																					as imprv_det_desc,
	rtrim(REPLACE(replace(imprv_fix.imprv_desc, char(10), ''), char(13), ''))							as Style, 
	rtrim(imprv_items.RoofCovering)																		as Roofing, 
	rtrim(imprv_items.HVAC)																				as Heating, 
	rtrim(imprv_items.ExtWall)																			as ExtWall,
	imprv_items.Bathrooms																				as Bathrooms, 
	imprv_items.HalfBaths																				as HalfBaths, 
	imprv_items.Fireplace																				as fireplace, 
	imprv_items.Foundation																				as foundation, 
	rtrim(imprv_items.Fixture_Count)																	as fixture_count,
	rtrim(imprv_items.FixtureCount)                                                                     as fixture_Cost,
	imprv_items.Fireplace_Cost																			as fireplace_cost, 
	sum_imprv_areas.attached_garage																		as attached_garage, 
	sum_imprv_areas.detached_garage																		as detached_garage,
	sum_imprv_areas.carport																				as Carport,
	sum_imprv_areas.Pole_building																		as Pole_building,
	ID.sketch_area,
	ID.calc_area,
		imprv_items.COMM_Units																								as Comm_Units,
		imprv_items.COMM_Tank_Type																								as Comm_Tank_Type,
		imprv_items.COMM_Tank_Capacity																						as Comm_Tank_Capacity,
		imprv_items.COMM_Service_Pit																							as Comm_Service_Pit,
		imprv_items.COMM_HVAC																									as Comm_HVAC, 
		imprv_items.COMM_Elevators																							As Comm_Elevator, 
		imprv_items.Comm__Sprinkler																							as Comm_Sprinkler,
		imprv_items.Comm_frame																								as Comm_Class_Description,
		imprv_items.COMM_Shape																								as Comm_Shape, 
		imprv_items.Comm_Shape_units																							as Comm_Shape_units,
		imprv_items.COMM_HVAC_units																							as COMM_HVAC_units,
		imprv_details.net_rentable_area																						as net_rentable_area,
		
	rtrim(REPLACE(replace(imprv_fix.imprv_desc, char(10), ''), char(13), ''))												as Business, 
	RTRIM(pu.property_use_cd)	+ ' (' + RTRIM(property_use_desc)+ ')'														AS Property_Use,
	RTRIM(pu.property_use_cd)																								as use_cd,
	RTRIM(property_use_desc)																								as use_description,
	sales.excise_number																										as excise_number,
	sales.deed_type_cd																										as deed_type_cd,
	adjusted_sl_price																										as adjustedSaleprice,
	sales.sl_price																											as OriginalSalePrice, 
	convert(char(20), sl_dt, 101)																							AS SaleDate,
	case when pv.market > 0 then CAST(ROUND((pv.market / sales.sl_price), 2) as decimal(10, 2)) else 0 end					as Current_Ratio,
	sales.sl_class_cd																					as Class_cd_at_sale,
	sales.sl_imprv_unit_price																			as Imprv_unit_price_at_sale,
	imprv_details.imprv_det_cost_unit_price																as Current_unit_price,
	 sales.sl_imprv_unit_price-imprv_details.imprv_det_cost_unit_price									as unit_price_diff,
	sales.sl_land_unit_price																			as Land_unit_price_at_sale,
	pp.land_unit_price																					as Land_UnitVal,
	imprv_fix.adjusted_val																				as Imprv_AdjVal,
	imprv_fix.flat_val																					as flat_value,	
	pv.market																							as TotalMarketValue,
	pv2.market																							as PreviousMarket,	
	pv.imprv_hstd_val + pv.imprv_non_hstd_val															as ImpVal,
	pv2.imprv_hstd_val + pv2.imprv_non_hstd_val															AS ImpVal_before, 
	imprv_fix.imprv_val_source																			as ImpVal_source, 	 
	pv.land_hstd_val + pv.land_non_hstd_val																as LandVal,
	pv2.land_hstd_val + pv2.land_non_hstd_val															AS LandVal_before, 
	pp.ls_table																							as LandVal_source,
	pv.legal_acreage																					as TotalAcres,
	pp.land_sqft																						as land_sqft,
	sl_ratio_type_cd																					as sl_ratio_type_cd, 
	sl_county_ratio_cd																					as sl_county_ratio_cd,
	land_only_sale																						as land_only_sale,
	imprv_fix.imp_new_val																				AS new_val, 
	--imprv_fix.imp_new_val																				as imprv_new_value,
	pv.ag_use_val																						as ag_use_val,
	pv2.ag_use_val																						as Previous_ag_use_val,
	
	ava																																as ava,
	fema.zone																														as flood_zone,
	sd.districtna																													as school_district,
	z.zoning																														as zoning,
	--lu.LandUseTyp as County_LandUse,
	pp.percent_complete																									as percent_complete,
	rtrim(permits.bldg_permit_status)																					as permit_status, 
	permits.bldg_permit_dt_complete																						as permit_complete_date, 
	bldg_permit_active																									as active_permits,
	permits.bldg_permit_issue_dt																						as permit_issue_date,
	rtrim(REPLACE(replace(permits.bldg_permit_num, char(10), ''), char(13),''))											as permit_num, 
	rtrim(REPLACE(replace(permits.bldg_permit_desc, char(10), ''), char(13),''))										as permit_desc, 
	rtrim(REPLACE(replace(permits.bldg_permit_cmnt, char(10), ''), char(13),''))										as permit_cmnt, 
	ap1.appraiser_full_name																		as 'next_appraiser',
	ap.appraiser_full_name																		as 'last_appraiser',
	convert(char(20), pv.last_appraisal_dt, 101)												as 'last_appraisal_dt',
	(pv.market - pv2.market	)																																		as 'gain_loss',
	case when pv2.market <> 0 then cast(round((pv.market / pv2.market) * 100 - 100, 2) 	as decimal(10, 2)) else 0 end												as 'pct_chg',
		(pv.imprv_hstd_val + pv.imprv_non_hstd_val)-(pv2.imprv_hstd_val + pv2.imprv_non_hstd_val)																	as imprv_gain_loss,
	(pv.land_hstd_val + pv.land_non_hstd_val)-(pv2.land_hstd_val + pv2.land_non_hstd_val)																			as land_gain_loss,
	case when(pv2.imprv_hstd_val + pv2.imprv_non_hstd_val) <> 0 
	then cast(round(((pv.imprv_hstd_val + pv.imprv_non_hstd_val) / (pv2.imprv_hstd_val + pv2.imprv_non_hstd_val)) * 100 - 100, 2) 	as decimal(10, 2)) else 0 end	as 'Imprv_pct_chg',
	case when(pv2.land_hstd_val + pv2.land_non_hstd_val) <> 0 
	then cast(round(((pv.land_hstd_val + pv.land_non_hstd_val) / (pv2.land_hstd_val + pv2.land_non_hstd_val)) * 100 - 100, 2) 	as decimal(10, 2)) else 0 end		as 'land_pct_chg',
	situs.primary_situs,	situs.situs_num,	situs.situs_street_prefx,	situs.situs_street,	situs.situs_street_sufix,situs.situs_unit,situs.situs_city,situs.situs_state,situs.situs_zip,situs.building_num,situs.sub_num,
	images.img_path,
	coords.XCoord,
	coords.YCoord

--imprv_details.unit_price																			as details_unit_price, 
--pp.imprv_unit_price																				as imprv_unit_price, 
--pp.heat_ac_code																					as heat_ac_code,
--pp.eff_yr_blt																						as eff_yr_blt,

--imprv_fix.imprv_state_cd																			as imprv_state_cd, 

--a.file_as_name																					as file_as_name,
--pv.sub_type																						as sub_type,

--chg_of_owner_id,


--rtrim(pp2.class_cd) + ' ' + rtrim(pp2.imprv_det_sub_class_cd)										as pre_subclass_cd,
 


--sl_land_unit_price,
--sl_type_cd,
--sl_qualifier,
--pv.township_section																				as section, 
--pv.township_code																					as township, 
--pv.range_code																						as range,
--pv.legal_acreage																					as legal_acres,
--pp.zoning,
--pp.land_front_feet,

--rtrim(replace(pv.abs_subdv_cd, CHAR(13) + CHAR(10), '-'))											as abs_subdv_cd, 


	FROM 
		(SELECT prop_id, SUM(size_acres) as size_acres, prop_val_yr 
			FROM [pacs_oltp].[dbo].land_detail 
				GROUP BY prop_id,  prop_val_yr) as land
LEFT JOIN (SELECT chg_of_owner_prop_assoc.prop_id, sale.sl_price,  sale.sl_ratio_type_cd, sale.sl_county_ratio_cd, sale.sl_dt, sale.adjusted_sl_price,sale.chg_of_owner_id,sale.land_only_sale,
			sale.sl_qualifier,sale.sl_land_unit_price,sale.sl_class_cd,sale.sl_imprv_unit_price,sale.sl_type_cd,sale.pers_prop_val,sale.sl_adj_rsn,sale.sl_land_type_cd,chg_of_owner.excise_number,
			chg_of_owner.deed_type_cd,ROW_NUMBER()over (partition by chg_of_owner_prop_assoc.prop_id ORDER BY sl_dt DESC) AS order_id
				FROM [pacs_oltp].[dbo].sale
left JOIN 
	[pacs_oltp].[dbo].chg_of_owner_prop_assoc 
		ON sale.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id
left join 
	[pacs_oltp].[dbo].chg_of_owner
		on chg_of_owner.chg_of_owner_id=chg_of_owner_prop_assoc.chg_of_owner_id
left join 	[pacs_oltp].[dbo].sales_mult_prop_val_vw 		ON chg_of_owner.chg_of_owner_id = sales_mult_prop_val_vw.chg_of_owner_id where chg_of_owner_prop_assoc.chg_of_owner_id IS NOT NULL AND sl_price > 0 			
			) as sales 
				ON land.prop_id = sales.prop_id AND sales.order_id = 1 
LEFT JOIN 
	property 
		ON land.prop_id = property.prop_id			
LEFT JOIN 
	( SELECT *, ROW_NUMBER() OVER (PARTITION BY prop_id ORDER BY imprv_val DESC) AS row_id 
		FROM [pacs_oltp].[dbo].imprv 
			WHERE [pacs_oltp].[dbo].imprv.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system) and sale_id=0 ) as imprv_fix 
				ON land.prop_id = imprv_fix.prop_id AND imprv_fix.row_id = 1 AND imprv_fix.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system)
LEFT JOIN 
	[pacs_oltp].[dbo].property_profile pp
		ON land.prop_id = pp.prop_id AND pp.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system) 
LEFT JOIN
	[pacs_oltp].[dbo].property_profile pp2
		ON land.prop_id = pp2.prop_id AND pp2.prop_val_yr = (select tax_yr from [pacs_oltp].[dbo].pacs_system) 
LEFT JOIN 
	[pacs_oltp].[dbo].property_val pv
		ON land.prop_id = pv.prop_id AND pv.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system) 
left join 
	[pacs_oltp].[dbo].appraiser ap 
		on pv.last_appraiser_id = ap.appraiser_id
left  join 
	[pacs_oltp].[dbo].appraiser ap1
		on pv.next_appraiser_id = ap1.appraiser_id
LEFT JOIN 
	property_val pv2
		ON land.prop_id = pv2.prop_id AND pv2.prop_val_yr = (select tax_yr from [pacs_oltp].[dbo].pacs_system)

LEFT JOIN 
	(SELECT [prop_id] ,[prop_val_yr],[imprv_id], sum([unit_price]) as unit_price, sum(imprv_det_cost_unit_price) as imprv_det_cost_unit_price,sum(net_rentable_area) as net_rentable_area,
		sum(new_value) as new_value
			FROM [pacs_oltp].[dbo].[imprv_detail]
				GROUP BY prop_id, imprv_id,[prop_val_yr]) as imprv_details 
					ON imprv_fix.prop_id = imprv_details.prop_id and imprv_fix.prop_val_yr = imprv_details.prop_val_yr and imprv_fix.imprv_id = imprv_details.imprv_id
LEFT JOIN
	(SELECT prop_id, imprv_id,
		CAST(SUM(finished_basement) AS INT) 	as finished_basement, 
		CAST(SUM(unfinished_basement) AS INT)	as unfinished_basement,
		CAST(SUM(attached_garage) AS INT) 		as attached_garage, 
		CAST(SUM(detached_garage) AS INT) 		as detached_garage,
		CAST(SUM(carport) AS INT) 				as carport,
		CAST(SUM(Pole_building) AS INT) 		as Pole_building
		
		FROM 
			(SELECT row_number() over (partition by prop_id order by "imprv_id" ASC) as "num", prop_id, imprv_id, imprv_det_id, 
				CASE WHEN rtrim(imprv_det_desc) = 'Main Area' THEN imprv_det_area ELSE 0 END AS living_area, 
				imprv_detail.imprv_det_type_cd,
				CASE WHEN rtrim(imprv_det_type_cd) = 'BSMT' THEN imprv_det_area ELSE 0 END AS finished_basement, 
				CASE WHEN rtrim(imprv_det_type_cd) = 'U-BSMT' THEN imprv_det_area ELSE 0 END AS unfinished_basement,
				CASE WHEN rtrim(imprv_det_type_cd) = 'ATTGAR' THEN imprv_det_area ELSE 0 END AS attached_garage, 
				CASE WHEN rtrim(imprv_det_type_cd) = 'DETGAR' THEN imprv_det_area ELSE 0 END AS detached_garage,
				CASE WHEN rtrim(imprv_det_type_cd) = 'carport' THEN imprv_det_area ELSE 0 END AS Carport,
				CASE WHEN rtrim(imprv_det_type_cd) = 'polebldg' THEN imprv_det_area ELSE 0 END AS Pole_building
					FROM [pacs_oltp].[dbo].imprv_detail 
						WHERE[prop_val_yr] = (select appr_yr from [pacs_oltp].[dbo].pacs_system)AND rtrim(imprv_det_type_cd) 
						IN ('MA', 'BSMT', 'ATTGAR', 'DETGAR', 'U-BSMT','carport','polebldg' ) OR rtrim(imprv_det_desc) = 'Main Area' ) as imprv_areas 
							GROUP BY prop_id, imprv_id)  as sum_imprv_areas ON imprv_fix.prop_id = sum_imprv_areas.prop_id AND imprv_fix.imprv_id = sum_imprv_areas.imprv_id
left join 
		(SELECT row_number() over (partition by prop_id order by "imprv_id" ASC) as "num", prop_id, imprv_id, imprv_det_id, 
		CASE WHEN rtrim(imprv_det_desc) = 'Main Area' THEN imprv_det_area ELSE 0 END AS living_area, 
		imprv_detail.imprv_det_type_cd,
		CASE WHEN rtrim(imprv_det_type_cd) = 'BSMT' THEN 'BSMT' ELSE 0 END AS finished_basement, 
		CASE WHEN rtrim(imprv_det_type_cd) = 'U-BSMT' THEN 'U-BSMT' ELSE 0 END AS unfinished_basement,
		CASE WHEN rtrim(imprv_det_type_cd) = 'ATTGAR' THEN 'ATTGAR'ELSE 0 END AS attached_garage, 
		CASE WHEN rtrim(imprv_det_type_cd) = 'DETGAR' THEN 'DETGAR' ELSE 0 END AS detached_garage,
		CASE WHEN rtrim(imprv_det_type_cd) = 'carport' THEN 'carport' ELSE 0 END AS Carport,
		CASE WHEN rtrim(imprv_det_type_cd) = 'polebldg' THEN 'polebldg' ELSE 0 END AS Pole_building
			FROM [pacs_oltp].[dbo].imprv_detail 
				WHERE[prop_val_yr] = (select appr_yr from [pacs_oltp].[dbo].pacs_system)AND rtrim(imprv_det_type_cd) 
					IN ('MA', 'BSMT', 'ATTGAR', 'DETGAR', 'U-BSMT','carport','polebldg' ) OR rtrim(imprv_det_desc) = 'Main Area'  
						GROUP BY prop_id, imprv_id  ,imprv_det_id,imprv_det_desc,imprv_det_area,imprv_detail.imprv_det_type_cd) as ia
						ON imprv_fix.prop_id = ia.prop_id AND imprv_fix.imprv_id = ia.imprv_id
LEFT JOIN 
	(SELECT imprv_id, prop_id, prop_val_yr, 
		SUM(CASE WHEN i_attr_val_id = 15 THEN CAST(i_attr_val_cd  AS INT ) else 0 END)	as Bedrooms,
		Sum(CASE WHEN i_attr_val_id = 45 THEN CAST(i_attr_unit AS INT)else 0 END)		as Bathrooms,
		Sum(CASE WHEN i_attr_val_id = 46 THEN CAST(i_attr_unit AS INT)else 0 END)		as HalfBaths,
		SUM(CASE WHEN i_attr_val_id = 47 THEN CAST(i_attr_unit AS INT)else 0 END)		as Fixture_Count,
		MIN(CASE WHEN i_attr_val_id = 2 THEN i_attr_val_cd  END)						as Foundation,
		MIN(CASE WHEN i_attr_val_id = 3 THEN i_attr_val_cd  END)						as ExtWall,
		MIN(CASE WHEN i_attr_val_id = 6 THEN i_attr_val_cd  END)						as RoofCovering,
		MIN(CASE WHEN i_attr_val_id = 9 THEN i_attr_val_cd  END)						as HVAC,
		MIN(CASE WHEN i_attr_val_id = 10 THEN i_attr_unit  END)							as Fireplace,
		SUM(CASE WHEN i_attr_val_id = 10 THEN imprv_attr_val else 0 END)				as Fireplace_Cost,
		SUM(CASE WHEN i_attr_val_id = 47 THEN imprv_attr_val else 0 END)				as FixtureCount,
		MIN(CASE WHEN i_attr_val_id = 39 THEN i_attr_val_cd END)						as Comm_frame,
		MIN(CASE WHEN i_attr_val_id = 51 THEN i_attr_val_cd END)						as Comm_Shape,	
		max(CASE WHEN i_attr_val_id = 51 THEN i_attr_unit END)							as Comm_Shape_units,						
		MIN(CASE WHEN i_attr_val_id = 61 THEN i_attr_val_cd END)						as COMM_Tank_Type,	
		max(CASE WHEN i_attr_val_id = 61 THEN i_attr_unit END)							as COMM_Tank_Type_units,					
		MIN(CASE WHEN i_attr_val_id = 63 THEN i_attr_val_cd END)						as COMM_Service_Pit,	
		max(CASE WHEN i_attr_val_id = 63 THEN i_attr_unit END)							as COMM_Service_Pit_units,						
		max(CASE WHEN i_attr_val_id = 62 THEN i_attr_val_cd END)						as COMM_Tank_Capacity,	
		max(CASE WHEN i_attr_val_id = 62 THEN i_attr_unit END)							as COMM_Tank_Capacity_units,						
		max(CASE WHEN i_attr_val_id = 58 THEN i_attr_val_cd END)						as COMM_Units,							
		MIN(CASE WHEN i_attr_val_id =12 THEN i_attr_val_cd END)							as Comm__Sprinkler,
		max(CASE WHEN i_attr_val_id = 12 THEN i_attr_unit END )							as Comm_Spinkler_units,					
		MIN(CASE WHEN i_attr_val_id = 31 THEN i_attr_val_cd END)						as COMM_HVAC,	
		max(CASE WHEN i_attr_val_id = 31 THEN i_attr_unit END )							as COMM_HVAC_units,								
		MIN(CASE WHEN i_attr_val_id = 56 THEN i_attr_val_cd END)						as COMM_Elevators,
		max(CASE WHEN i_attr_val_id = 56 THEN i_attr_unit END)							as COMM_Elevator_unit	
			FROM [pacs_oltp].[dbo].imprv_attr
				GROUP BY prop_id, imprv_id, prop_val_yr ) as imprv_items 
					ON imprv_fix.prop_id = imprv_items.prop_id AND imprv_fix.imprv_id = imprv_items.imprv_id AND imprv_items.prop_val_yr = (select appr_yr from[pacs_oltp].[dbo]. pacs_system) 
left join
	(SELECT distinct [prop_id]
      ,[prop_val_yr],[imprv_id],[imprv_det_id] ,[sup_num]  ,[sale_id] ,[imprv_det_class_cd],[imprv_det_meth_cd]  ,[imprv_det_type_cd] ,[seq_num] ,[imprv_det_val] ,[imprv_det_val_source]
      ,[imprv_det_desc] ,[imprv_det_area] ,[imprv_det_area_type] ,[calc_area] ,[sketch_area]     
  FROM [pacs_oltp].[dbo].[imprv_detail]
	 where prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)
			and sale_id=0
			and imprv_det_desc='Main Area') as id on imprv_fix.prop_id = id.prop_id AND imprv_fix.imprv_id = id.imprv_id AND imprv_items.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system) 
LEFT JOIN 
	[pacs_oltp].[dbo].land_detail 
		ON property.prop_id = land_detail.prop_id AND land_detail.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system)
left join
	[pacs_oltp].[dbo].property_use AS pu	
		ON	pu.property_use_cd= pv.property_use_cd 
LEFT JOIN 
	[pacs_oltp].[dbo].abs_subdv 
		ON pv.abs_subdv_cd = abs_subdv.abs_subdv_cd 
LEFT Join 
	[pacs_oltp].[dbo].situs 
		on pv.prop_id=situs.prop_id
left join 
	[pacs_oltp].[dbo].__Parcel_AVA ava
			on pv.prop_id= ava.prop_id
left join
	[Benton_spatial_data].[dbo].[PARCEL_FEMA] fema on pv.prop_id=fema.prop_id
left join 
	[Benton_spatial_data].[dbo].[PARCEL_SCHOOLDISTRICT] sd on pv.prop_id =sd.prop_id
left join 
	[pacs_oltp].[dbo].zoning z on pv.prop_id =z.prop_id
--left join [Benton_spatial_data].[dbo].[PARCEL_ZONING] lu on pv.prop_id=lu.prop_id
left join
	[pacs_oltp].[dbo].owner o
		on  pv.prop_id = o.prop_id  and pv.prop_val_yr = o.owner_tax_yr and pv.sup_num = o.sup_num
inner  join
	[pacs_oltp].[dbo].account a
		on o.owner_id=a.acct_id
LEFT JOIN 
	(SELECT vw.prop_id, ROW_NUMBER() over (partition by vw.prop_id ORDER BY vw.bldg_permit_id DESC) AS order_id,vw.bldg_permit_status, vw.bldg_permit_issue_dt, vw.bldg_permit_active, building_permit.bldg_permit_cmnt,
		building_permit.bldg_permit_desc, vw.bldg_permit_num, building_permit.bldg_permit_dt_complete
			FROM [pacs_oltp].[dbo].BUILDING_PERMIT_VW as vw
LEFT JOIN 
	[pacs_oltp].[dbo].building_permit 
		ON vw.bldg_permit_id = building_permit.bldg_permit_id
			WHERE prop_id IS NOT NULL ) as permits 
				ON land.prop_id = permits.prop_id AND permits.order_id = 1
LEFT JOIN 
	[pacs_oltp].[dbo].wash_prop_owner_tax_area_assoc AS wta WITH (nolock) 
		ON wta.year = pv.prop_val_yr AND wta.prop_id = pv.prop_id AND wta.sup_num = pv.sup_num 
left join
	tax_area AS ta WITH (nolock) 
		ON ta.tax_area_id = wta.tax_area_id
left join
	(SELECT  row_number() over (partition by prop_id order by id desc) as order_id, prop_id, REPLACE( REPLACE( image_path, '\\CHPACS\OLTP\pacs_oltp\Images\',''), '\\CHPACS\OLTP\pacs_oltp\\','') AS img_path
		FROM [web_internet_benton].[dbo].[_clientdb_property_image]
			WHERE image_type = 'PIC' ) as images 
				ON land.prop_id = images.prop_id AND images.order_id = 1

LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],
	--[Geometry].STCentroid().STX as XCoord,
	--[Geometry].STCentroid().STY as YCoord ,
	  [Shape].STCentroid().STX as XCoord,
	[Shape].STCentroid().STY as YCoord 
	--[CENTROID_X] as XCoord
     -- ,[CENTROID_Y] as YCoord
		FROM [Benton_spatial_data].[dbo].[parcel]) as coords
			ON land.prop_id = coords.Prop_ID AND coords.order_id = 1
				WHERE land.prop_val_yr = (select appr_yr  from [pacs_oltp].[dbo].pacs_system)  
			and pv.prop_inactive_dt is null	and situs.primary_situs= 'Y'and prop_type_cd='r'
			and pv.sup_num=0
			--and pv.property_use_cd between '21' and '39'
		--	and pv.property_use_cd not like '14'and pv.property_use_cd not like '18'and pv.property_use_cd not like '11'
		--and pv.hood_cd like '1%'
			--and pv.hood_cd like '5%'
			and pv.hood_cd like '8%'
			--and pv.hood_cd is null
				--and pv.sub_type = 'lh'
			--and sales.sl_dt>='01/01/2016'
				--and sales.sl_ratio_type_cd='00'

GO

