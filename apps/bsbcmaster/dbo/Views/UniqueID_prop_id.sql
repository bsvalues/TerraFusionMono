
create view UniqueID_prop_id
as

  SELECT 
    ROW_NUMBER() OVER (ORDER BY prop_id) AS UniqueID_prop_id,
     geo_id,
    prop_id, prop_type_cd

 FROM [pacs_oltp].[dbo].[property]
where prop_type_cd='R'

GO

