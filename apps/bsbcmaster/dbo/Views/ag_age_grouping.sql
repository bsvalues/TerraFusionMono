create view ag_age_grouping as

SELECT id.[prop_id],ID.prop_val_yr,
--NTILE(5) over (partition by id.actual_age ORDER BY id.imprv_det_type_cd desc)AS age_group,
--NTILE(5) over (partition by permanent_crop_acres ORDER BY id.imprv_det_type_cd desc)AS acres_group,
--NTILE(5) over (partition by imprv_det_class_cd ORDER BY id.imprv_det_type_cd desc)AS class_cd_group,
id.imprv_det_type_cd,--permanent_crop_acres,
--Sum(case when   id.imprv_det_type_cd IS not null	then	( permanent_crop_acres  )	else	null	end) as	imprv_pc_acres ,
sum(case when actual_age  between 0 and 3 then ( permanent_crop_acres  ) else null end) as age_0_to_3,
sum(case when actual_age  between 4 and 8 then ( permanent_crop_acres  ) else null end) as age_4_to_8,
sum(case when actual_age  between 5 and 15 then ( permanent_crop_acres  ) else null end) as age_9_to_15,
sum(case when actual_age  between 16 and 25 then ( permanent_crop_acres  )else null end) as age_16_to_25,
sum(case when actual_age  between 26 and 200 then ( permanent_crop_acres  ) else null end) as age_26_plus,
actual_age,
[imprv_det_class_cd] as class_cd,[imprv_det_meth_cd],[permanent_crop_density]
  FROM [dbo].[imprv_detail] id
   left join 
   imprv
    ON id.prop_val_yr = imprv.prop_val_yr 
   AND id.sup_num = imprv.sup_num 
   AND id.sale_id = imprv.sale_id 
   AND id.prop_id = imprv.prop_id 
   AND id.imprv_id = imprv.imprv_id
   						 
  where --id.prop_val_yr=2019
 -- and
   id.sale_id=0
  and imprv.imprv_type_cd='permc'
  and id.imprv_det_meth_cd not like 'irr'
and id.imprv_det_meth_cd not like 'trl'
-- and imprv_det_meth_cd like 'V1'
--and imprv_det_type_cd like'AG-HAYSTOR '
--and imprv_det_type_cd like '%V16-Merlot'
and id.actual_age is not null




group by id.[prop_id],id.[prop_val_yr]  ,id.[imprv_id]   ,[imprv_det_id]    ,id.[sup_num]    ,id.[sale_id]     ,[imprv_det_class_cd]     ,[imprv_det_meth_cd]     ,[imprv_det_type_cd]    ,actual_age

      ,[permanent_crop_acres]      ,[permanent_crop_density]
--order by imprv_det_type_cd,id.prop_id

GO

