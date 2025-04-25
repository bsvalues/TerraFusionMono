create view OCCUPANCY_class_quality_proval as
SELECT [ID]
      ,[CONSTRUCTION_CLASS_ID]
      ,[OCCUPANCY_ID]
      ,[COMPONENT_ID]
      ,[QUALITY_ID]
      ,[DEFAULT_ARCH_FEE_MULTIPLIER]
      ,[DEFAULT_TYPICAL_LIFE]
  FROM [mvp_cost_3Q2016].[mvp].[OCCUPANCY_CLASS_QUALITY]

GO

