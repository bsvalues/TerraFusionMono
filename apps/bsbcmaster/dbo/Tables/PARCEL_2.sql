CREATE TABLE [dbo].[PARCEL_2] (
    [OBJECTID]   INT              IDENTITY (1, 1) NOT NULL,
    [Shape]      [sys].[geometry] NULL,
    [Parcel_ID]  NVARCHAR (15)    NULL,
    [Prop_ID]    INT              NULL,
    [CENTROID_X] NUMERIC (38, 8)  NULL,
    [CENTROID_Y] NUMERIC (38, 8)  NULL,
    PRIMARY KEY CLUSTERED ([OBJECTID] ASC)
);


GO

CREATE SPATIAL INDEX [FDO_Shape]
    ON [dbo].[PARCEL_2] ([Shape])
    WITH  (
            BOUNDING_BOX = (XMAX = 120779100, XMIN = -117498300, YMAX = 98059600, YMIN = -98850300),
            CELLS_PER_OBJECT = 16
          );


GO

