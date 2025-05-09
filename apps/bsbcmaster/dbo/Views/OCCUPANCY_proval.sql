create view OCCUPANCY_proval as
SELECT  [ID]
      ,[COMPONENT_OCCUPANCY_STATUS_ID]
      ,[DEPRECIATION_TYPE_ID]
      ,[VALUATION_METHOD_ID]
      ,[BOOK_SECTION_ID]
      ,[CODE]
      ,[OCCUPANCY_NAME]
      ,[DEFAULT_STORY_HEIGHT]
      ,[DEFAULT_BASEMENT_DEPTH]
      ,[PERIMETER_MODIFIER]
  FROM [mvp_cost_3Q2016].[mvp].[OCCUPANCY]

GO

