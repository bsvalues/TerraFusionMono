CREATE TABLE [dbo].[pp_review_type] (
    [code]        VARCHAR (25)  NOT NULL,
    [description] VARCHAR (100) NULL,
    CONSTRAINT [CPK_pp_review_type] PRIMARY KEY CLUSTERED ([code] ASC)
);


GO

