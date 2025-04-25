CREATE TABLE [dbo].[ccCheckSum_land_adj_old] (
    [prop_val_yr]      NUMERIC (4) NOT NULL,
    [sup_num]          INT         NOT NULL,
    [sale_id]          INT         NOT NULL,
    [prop_id]          INT         NOT NULL,
    [land_seg_id]      INT         NOT NULL,
    [land_seg_adj_seq] INT         NOT NULL,
    [checksum_val]     INT         NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_land_adj_old]([prop_val_yr] ASC, [sup_num] ASC, [sale_id] ASC, [prop_id] ASC, [land_seg_id] ASC, [land_seg_adj_seq] ASC);


GO

