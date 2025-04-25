CREATE TABLE [dbo].[_20240516_rbk_DO95365_posted_coll_transaction] (
    [posted_transaction_id] INT             IDENTITY (1, 1) NOT NULL,
    [transaction_id]        INT             NOT NULL,
    [trans_group_id]        INT             NOT NULL,
    [base_amount]           NUMERIC (14, 2) NOT NULL,
    [base_amount_pd]        NUMERIC (14, 2) NOT NULL,
    [penalty_amount_pd]     NUMERIC (14, 2) NOT NULL,
    [interest_amount_pd]    NUMERIC (14, 2) NOT NULL,
    [bond_interest_pd]      NUMERIC (14, 2) NOT NULL,
    [transaction_type]      VARCHAR (10)    NOT NULL,
    [underage_amount_pd]    NUMERIC (14, 2) NOT NULL,
    [overage_amount_pd]     NUMERIC (14, 2) NOT NULL,
    [pacs_user_id]          INT             NOT NULL,
    [transaction_date]      DATETIME        NOT NULL,
    [posted_date]           DATETIME        NOT NULL,
    [effective_date]        DATETIME        NOT NULL,
    [other_amount_pd]       NUMERIC (14, 2) NULL,
    [recorded_date]         DATETIME        NULL,
    [is_reopen]             BIT             NOT NULL
);


GO

