create view perm_crop_1 as

SELECT  id.prop_id,
max(case when ia.imprv_det_type_cd=	 'C01-Bing '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'C01-Bing 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 '27-Grenac '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'C02-Rainie 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 '35-Top Re'	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'C04-Chelan 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'C02-Rainie '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O01-Apples 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'C04-Chelan '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O02-Cherri 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O01-Apples '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O03-Pears 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O02-Cherri '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O04-Peache 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O03-Pears '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O05-Nectar 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O04-Peache '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O06-Aprico 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O05-Nectar '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O07-Plums	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O06-Aprico '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O08-Prunes 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O07-Plums '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O09-Nuts	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O08-Prunes '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O10-Gala	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O09-Nuts '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O11-Fuji	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O10-Gala'	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O12-Braebu 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O11-Fuji '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O14-Red Ch	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O12-Braebu '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O17-Oregon	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O14-Red Ch '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O18-Scarle 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O17-Oregon '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O20-Cameo 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O18-Scarle '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O21-Spur R 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O20-Cameo '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O22-Golden 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O21-Spur R '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O24-Granny 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O22-Golden '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O25-Jonago 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O24-Granny '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O27-Washin 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O25-Jonago '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O31-Winesa 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O27-Washin '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O32-Rome	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O31-Winesa '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O34-Bisbee 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O32-Rome '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 '35-Top Re	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O34-Bisbee '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O36-Red De	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O36-Red De'	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O39-Pink L 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O39-Pink L '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O40-Gala B 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O40-Gala B '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O41-Gala B 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O41-Gala B '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O42-Gala B 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O42-Gala B '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O44-Gala C 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O44-Gala C '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O45-Gala G 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O45-Gala G '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O46-Gala G 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O46-Gala G '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O47-Gala G 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O47-Gala G '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O48-Gala I 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O48-Gala I '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O49-Gala P 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O49-Gala P '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O50-Gala S 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O50-Gala S '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O53-Gala R 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O53-Gala R '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O54-Gala U 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O54-Gala U '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O56-Fuji N 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O56-Fuji N '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O57-Fuji T 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O57-Fuji T '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O58-Fuji R 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O58-Fuji R '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O59-Fuji R 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O59-Fuji R '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O61-Fuji S 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O61-Fuji S '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O62-Fuji R 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O62-Fuji R '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O63-Braebu 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O63-Braebu '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O65-Braebu 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O65-Braebu '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O66-Braebu	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O66-Braebu'	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O70-Pacifi 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O70-Pacifi '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O75-Earlig	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O75-Earlig '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O83-Ginger	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O83-Ginger '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O84-Golden 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O84-Golden '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O87-Red Va 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O87-Red Va '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'O89-Honeyc 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'O89-Honeyc '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V01-Wine G 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V01-Wine G '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V02-Juice 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V02-Juice '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V03-Aspara 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V03-Aspara '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V04-Hops 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V04-Hops '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V05-Red Cu 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V05-Red Cu '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V06-Chardo	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V06-Chardo '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V07-Pinot 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V07-Pinot '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V08-Sauvig 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V08-Sauvig '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V09-Semill 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V09-Semill '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V10-Chenin 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V10-Chenin '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V11-Gewurz 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V11-Gewurz '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V12-Muscat 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V12-Muscat '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V13-Riesli 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V13-Riesli '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V14-Other 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V14-Other '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V15-Cabern 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V15-Cabern '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V16-Merlot 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V16-Merlot '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V17-Syrah 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V17-Syrah '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V18-Pinot 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V18-Pinot '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V19-Limber 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V19-Limber '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V20-Other 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V20-Other '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V21-Concor	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V21-Concor '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V22-Niagar 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V22-Niagar '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V23-Viogni 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V23-Viogni '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V24-Cabern 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V24-Cabern '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V25-Sangio	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V25-Sangio '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V26-Zinfan 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V26-Zinfan '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 '27-Grenac 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V28-Mabec '	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V28-Mabec 	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V29-Nebbio'	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V29-Nebbio	_	1	 '	,
max(case when ia.imprv_det_type_cd=	 'V31-Bluebe'	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		 'V31-Bluebe	_	1	 '	,

max(case when ia.imprv_det_type_cd=	'V32-Raspbe'	and ia.order_id =	1	then	ia.imprv_pc_acres	else	null	end) as		'V32-Raspbe	_	1	 '	






 FROM           pacs_oltp.dbo.imprv_detail  id 
  
  
  INNER JOIN
                         pacs_oltp.dbo.imprv ON id.prop_val_yr = imprv.prop_val_yr AND id.sup_num = imprv.sup_num AND id.sale_id = imprv.sale_id AND id.prop_id = imprv.prop_id AND 
                         id.imprv_id = imprv.imprv_id
						 left join 
						 pacs_oltp.dbo.property_val pv on pv.prop_id=id.prop_id and pv.prop_val_yr=id.prop_val_yr and pv.sup_num=id.sup_num 

  inner join 
(select [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [Shape_Area] DESC) AS order_id,[Prop_ID],Geometry,[Geometry].STCentroid().STX as XCoord,
[Geometry].STCentroid().STY as YCoord ,[Shape],[CENTROID_X] as x ,[CENTROID_Y] as y

FROM 
[Benton_spatial_data].[dbo].[spatial_parcel])as sp on id.prop_id=sp.prop_id
inner join
(
SELECT distinct  id.prop_id,
ROW_NUMBER() over (partition by id.prop_id, id.imprv_det_type_cd ORDER BY ID.imprv_det_meth_cd desc)AS order_id, 
ID.imprv_det_meth_cd, id.imprv_det_type_cd,
Sum(case when   id.imprv_det_type_cd IS not null	
	then	( permanent_crop_acres  )	else	null	end) as	imprv_pc_acres 
	 
	
 FROM           pacs_oltp.dbo.imprv_detail  id 
  inner join
                         pacs_oltp.dbo.imprv ON id.prop_val_yr = imprv.prop_val_yr AND id.sup_num = imprv.sup_num AND id.sale_id = imprv.sale_id AND id.prop_id = imprv.prop_id AND 
                         id.imprv_id = imprv.imprv_id
						 left join 
						 pacs_oltp.dbo.property_val pv on pv.prop_id=id.prop_id and pv.prop_val_yr=id.prop_val_yr and pv.sup_num=id.sup_num 

where 
id.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)
and id.sale_id=0
and imprv.imprv_type_cd='permc'
and id.imprv_det_meth_cd not like 'irr'
and id.imprv_det_meth_cd not like 'trl'
--and id.prop_id=26521
--and imprv_det_type_cd like'AG-HAYSTOR '
--and imprv_det_type_cd like '%V16-Merlot'
and permanent_crop_acres is not null 
--and id.prop_id=21153

group by 
id.prop_id,id.imprv_det_id,id.imprv_det_type_cd,permanent_crop_acres,ID.imprv_det_meth_cd



) as ia on ia.prop_id=id.prop_id

group by id.prop_id

GO

