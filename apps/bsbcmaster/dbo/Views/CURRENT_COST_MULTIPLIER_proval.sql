create view CURRENT_COST_MULTIPLIER_proval as 
SELECT [ID]
      ,[CCM_GROUP_ID]
      ,[CONSTRUCTION_CLASS_ID]
      ,[REGION_ID]
      ,[MULTIPLIER_VALUE]
  FROM [mvp_cost_3Q2016].[mvp].[CURRENT_COST_MULTIPLIER]

GO

