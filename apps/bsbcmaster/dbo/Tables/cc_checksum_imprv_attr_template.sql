CREATE TABLE [dbo].[cc_checksum_imprv_attr_template] (
    [prop_val_yr]   NUMERIC (4) NOT NULL,
    [sup_num]       INT         NOT NULL,
    [sale_id]       INT         NOT NULL,
    [prop_id]       INT         NOT NULL,
    [imprv_id]      INT         NOT NULL,
    [imprv_det_id]  INT         NOT NULL,
    [imprv_attr_id] INT         NOT NULL,
    [i_attr_val_id] INT         NOT NULL,
    [checksum_val]  INT         NULL
);


GO

