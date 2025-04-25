CREATE TABLE [dbo].[cc_checksum_land_detail_characteristic_template] (
    [prop_val_yr]       NUMERIC (4)  NOT NULL,
    [sup_num]           INT          NOT NULL,
    [sale_id]           INT          NOT NULL,
    [prop_id]           INT          NOT NULL,
    [land_seg_id]       INT          NOT NULL,
    [characteristic_cd] VARCHAR (10) NOT NULL,
    [determinant_cd]    VARCHAR (20) NOT NULL,
    [checksum_val]      INT          NULL
);


GO

