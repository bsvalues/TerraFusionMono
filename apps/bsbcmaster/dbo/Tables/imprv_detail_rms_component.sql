CREATE TABLE [dbo].[imprv_detail_rms_component] (
    [prop_val_yr]                NUMERIC (4)     NOT NULL,
    [sup_num]                    INT             NOT NULL,
    [sale_id]                    INT             NOT NULL,
    [prop_id]                    INT             NOT NULL,
    [imprv_id]                   INT             NOT NULL,
    [imprv_det_id]               INT             NOT NULL,
    [section_id]                 INT             NOT NULL,
    [pacs_component_id]          INT             NOT NULL,
    [tsRowVersion]               ROWVERSION      NOT NULL,
    [ComponentID]                INT             NOT NULL,
    [Units]                      INT             NOT NULL,
    [ComponentPct]               NUMERIC (5, 2)  NOT NULL,
    [QualityID]                  NUMERIC (3, 2)  NOT NULL,
    [QualityOverride]            BIT             NOT NULL,
    [DeprPct]                    NUMERIC (5, 2)  NOT NULL,
    [DeprOverride]               BIT             NOT NULL,
    [EffectiveYearBuilt]         INT             NOT NULL,
    [EffectiveYearBuiltOverride] BIT             NOT NULL,
    [TypicalLife]                INT             NOT NULL,
    [TypicalLifeOverride]        BIT             NOT NULL,
    [UnitPrice]                  NUMERIC (14, 2) NOT NULL,
    [AdjUnitPrice]               NUMERIC (14, 2) NOT NULL,
    [ComponentValueRCN]          INT             NOT NULL,
    [ComponentValueRCNLD]        INT             NOT NULL,
    [QualityIDLower]             AS              (CONVERT([smallint],[QualityID]-[QualityID]%(1.0),0)),
    [QualityIDUpper]             AS              (CONVERT([smallint],case when [QualityID]%(1.0)=(0.0) then [QualityID]-[QualityID]%(1.0) else ([QualityID]-[QualityID]%(1.0))+(1) end,0)),
    CONSTRAINT [CPK_imprv_detail_rms_component] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [sale_id] ASC, [prop_id] ASC, [imprv_id] ASC, [imprv_det_id] ASC, [section_id] ASC, [pacs_component_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CCK_imprv_detail_rms_component_Percentages] CHECK ([ComponentPct]>=(0) AND [ComponentPct]<=(100) AND [DeprPct]>=(0) AND [DeprPct]<=(100)),
    CONSTRAINT [CCK_imprv_detail_rms_component_QualityID] CHECK ([QualityID]>=(1.00) AND [QualityID]<=(6.00)),
    CONSTRAINT [CFK_imprv_detail_rms_component_prop_val_yr_sup_num_sale_id_prop_id_imprv_id_imprv_det_id_section_id] FOREIGN KEY ([prop_val_yr], [sup_num], [sale_id], [prop_id], [imprv_id], [imprv_det_id], [section_id]) REFERENCES [dbo].[imprv_detail_rms_section] ([prop_val_yr], [sup_num], [sale_id], [prop_id], [imprv_id], [imprv_det_id], [section_id]) ON DELETE CASCADE
);


GO

