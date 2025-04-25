CREATE TABLE [dbo].[td_sup_group_property_info] (
    [sup_group_id]             INT              NOT NULL,
    [sup_yr]                   NUMERIC (4)      NOT NULL,
    [sup_num]                  INT              NOT NULL,
    [prop_id]                  INT              NOT NULL,
    [pacs_user_id]             INT              NOT NULL,
    [data_flag]                BIT              NOT NULL,
    [sup_action]               CHAR (1)         NULL,
    [sup_cd]                   VARCHAR (10)     NULL,
    [owner_id]                 INT              NOT NULL,
    [pct_ownership]            NUMERIC (13, 10) NULL,
    [prop_type_cd]             VARCHAR (5)      NOT NULL,
    [prop_sub_type_cd]         VARCHAR (5)      NULL,
    [property_identifier]      VARCHAR (70)     NULL,
    [ref_id2]                  VARCHAR (50)     NULL,
    [geo_id]                   VARCHAR (50)     NULL,
    [mineral_int_pct]          NUMERIC (13, 10) NULL,
    [type_of_int]              VARCHAR (5)      NULL,
    [acres]                    NUMERIC (14, 4)  NULL,
    [imprv_hstd_val]           NUMERIC (14)     NULL,
    [market]                   NUMERIC (14)     NULL,
    [file_as_name]             VARCHAR (70)     NULL,
    [legal_desc]               VARCHAR (255)    NULL,
    [imprv_non_hstd_val]       NUMERIC (14)     NULL,
    [prod_loss]                NUMERIC (14)     NULL,
    [addr_line1]               VARCHAR (60)     NULL,
    [land_hstd_val]            NUMERIC (14)     NULL,
    [appraised_val]            NUMERIC (14)     NULL,
    [addr_line2]               VARCHAR (60)     NULL,
    [appraiser_nm]             VARCHAR (51)     NULL,
    [operator]                 VARCHAR (30)     NULL,
    [legal_acreage]            NUMERIC (14, 4)  NULL,
    [land_non_hstd_val]        NUMERIC (14)     NULL,
    [ten_percent_cap]          NUMERIC (14)     NULL,
    [addr_line3]               VARCHAR (60)     NULL,
    [state_codes]              VARCHAR (50)     NULL,
    [map_id]                   VARCHAR (20)     NULL,
    [curr_use_hs_market]       NUMERIC (14)     NULL,
    [tax_area]                 VARCHAR (23)     NULL,
    [situs_display]            VARCHAR (146)    NULL,
    [verified_user_id]         INT              NULL,
    [verified_dt]              DATETIME         NULL,
    [exemptions]               VARCHAR (20)     NULL,
    [senior_pct]               NUMERIC (5, 2)   NULL,
    [new_value]                NUMERIC (14)     NULL,
    [new_senior_value]         NUMERIC (14)     NULL,
    [curr_use_nhs_market]      NUMERIC (14)     NULL,
    [personal_property_market] NUMERIC (14)     NULL,
    [frozen_appraised_val]     NUMERIC (14)     NULL,
    [non_frozen_appraised_val] NUMERIC (14)     NULL,
    [senior_exemption_loss]    NUMERIC (14)     NULL,
    [exemption_loss]           NUMERIC (14)     NULL,
    [frozen_taxable]           NUMERIC (14)     NULL,
    [non_frozen_taxable]       NUMERIC (14)     NULL,
    [taxable]                  NUMERIC (14)     NULL,
    [addr_line4]               VARCHAR (128)    NULL,
    [mortgage_cd]              VARCHAR (10)     NULL,
    [ref_id1]                  VARCHAR (50)     NULL,
    [sup_desc]                 VARCHAR (500)    NULL,
    [addr_is_international]    BIT              DEFAULT ((0)) NOT NULL,
    [country_name]             VARCHAR (50)     NULL,
    [tax_area_id]              INT              NULL,
    [pending_tax_area]         VARCHAR (23)     NULL,
    [ag_use_val]               NUMERIC (14)     NULL,
    [ag_hs_use_val]            NUMERIC (14)     NULL,
    [prorate_begin]            DATETIME         NULL,
    [prorate_end]              DATETIME         NULL,
    CONSTRAINT [CPK_td_sup_group_property_info] PRIMARY KEY CLUSTERED ([sup_group_id] ASC, [sup_yr] ASC, [sup_num] ASC, [prop_id] ASC, [data_flag] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_td_sup_group_property_info_sup_group_id] FOREIGN KEY ([sup_group_id]) REFERENCES [dbo].[sup_group] ([sup_group_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The exemption prorate begin date', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'td_sup_group_property_info', @level2type = N'COLUMN', @level2name = N'prorate_end';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The exemption prorate begin date', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'td_sup_group_property_info', @level2type = N'COLUMN', @level2name = N'prorate_begin';


GO

