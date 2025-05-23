CREATE TABLE [dbo].[fiscal_year_collection_year_begin_balance_due_levy] (
    [fiscal_year_id]  INT             NOT NULL,
    [collection_year] NUMERIC (4)     NOT NULL,
    [levy_cd]         VARCHAR (10)    NOT NULL,
    [balance_due]     NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_fiscal_year_collection_year_begin_balance_due_levy] PRIMARY KEY CLUSTERED ([fiscal_year_id] ASC, [collection_year] ASC, [levy_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_fiscal_year_collection_year_begin_balance_due_levy_fiscal_year_id] FOREIGN KEY ([fiscal_year_id]) REFERENCES [dbo].[fiscal_year] ([fiscal_year_id]) ON DELETE CASCADE
);


GO

