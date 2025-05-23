CREATE TABLE [dbo].[prop_owner_entity_val] (
    [prop_id]                     INT              NOT NULL,
    [owner_id]                    INT              NOT NULL,
    [sup_num]                     INT              NOT NULL,
    [sup_yr]                      NUMERIC (4)      NOT NULL,
    [entity_id]                   INT              NOT NULL,
    [taxable_val]                 NUMERIC (14)     NULL,
    [assessed_val]                NUMERIC (14)     NULL,
    [frz_taxable_val]             NUMERIC (14)     NULL,
    [frz_assessed_val]            NUMERIC (14)     NULL,
    [frz_actual_tax]              NUMERIC (14, 2)  NULL,
    [frz_tax_rate]                NUMERIC (13, 10) NULL,
    [frz_levy_actual_tax]         NUMERIC (14, 2)  NULL,
    [weed_taxable_acres]          NUMERIC (14, 4)  NULL,
    [land_hstd_val]               NUMERIC (14)     NULL,
    [land_non_hstd_val]           NUMERIC (14)     NULL,
    [imprv_hstd_val]              NUMERIC (14)     NULL,
    [imprv_non_hstd_val]          NUMERIC (14)     NULL,
    [ag_market]                   NUMERIC (14)     NULL,
    [ag_use_val]                  NUMERIC (14)     NULL,
    [timber_market]               NUMERIC (14)     NULL,
    [timber_use]                  NUMERIC (14)     NULL,
    [ten_percent_cap]             NUMERIC (14)     NULL,
    [exempt_val]                  NUMERIC (14)     NULL,
    [prop_type_cd]                CHAR (5)         NULL,
    [tax_increment_flag]          CHAR (1)         NULL,
    [tax_increment_imprv_val]     NUMERIC (14)     NULL,
    [tax_increment_land_val]      NUMERIC (14)     NULL,
    [arb_status]                  VARCHAR (1)      NULL,
    [market_val]                  NUMERIC (14)     NULL,
    [ag_late_loss]                NUMERIC (14)     NULL,
    [appraised_val]               NUMERIC (14)     NULL,
    [freeport_late_loss]          NUMERIC (14)     NULL,
    [transfer_pct]                NUMERIC (9, 6)   NULL,
    [transfer_freeze_assessed]    NUMERIC (14)     NULL,
    [transfer_freeze_taxable]     NUMERIC (14)     NULL,
    [transfer_entity_taxable]     NUMERIC (14)     NULL,
    [transfer_taxable_adjustment] NUMERIC (14)     NULL,
    [transfer_flag]               CHAR (1)         NULL,
    [ptd_actual_tax]              NUMERIC (14, 2)  NULL,
    [new_val_hs]                  NUMERIC (14)     NULL,
    [new_val_nhs]                 NUMERIC (14)     NULL,
    [new_val_p]                   NUMERIC (14)     NULL,
    [new_val_taxable]             NUMERIC (14)     NULL,
    [freeze_type]                 VARCHAR (10)     NULL,
    [freeze_ceiling]              NUMERIC (14, 2)  NULL,
    [freeze_yr]                   NUMERIC (4)      NULL,
    [actual_new_val_hs]           NUMERIC (14)     NULL,
    [actual_new_val_nhs]          NUMERIC (14)     NULL,
    [actual_new_val_p]            NUMERIC (14)     NULL,
    [actual_new_val_taxable]      NUMERIC (14)     NULL,
    CONSTRAINT [CPK_prop_owner_entity_val] PRIMARY KEY CLUSTERED ([sup_yr] ASC, [sup_num] ASC, [entity_id] ASC, [prop_id] ASC, [owner_id] ASC) WITH (FILLFACTOR = 70)
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[prop_owner_entity_val]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

