CREATE TABLE [dbo].[_fund_numb_check] (
    [fund_number]         NUMERIC (14) NOT NULL,
    [description]         VARCHAR (50) NULL,
    [tax_district_id]     INT          NULL,
    [levy_cd]             VARCHAR (10) NOT NULL,
    [display_fund_number] VARCHAR (10) NULL
);


GO

