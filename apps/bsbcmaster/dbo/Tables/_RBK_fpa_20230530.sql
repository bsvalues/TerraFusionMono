CREATE TABLE [dbo].[_RBK_fpa_20230530] (
    [fee_id]            INT             NOT NULL,
    [fee_payment_id]    INT             NOT NULL,
    [year]              NUMERIC (4)     NOT NULL,
    [amount_due]        NUMERIC (14, 2) NOT NULL,
    [amount_paid]       NUMERIC (14, 2) NOT NULL,
    [due_date]          DATETIME        NULL,
    [is_payout_payment] BIT             NOT NULL
);


GO

