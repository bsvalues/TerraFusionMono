CREATE AGGREGATE [dbo].[CommaListConcatenate](@value NVARCHAR (4000) NULL)
    RETURNS NVARCHAR (4000)
    EXTERNAL NAME [TASQLCLR].[TASQLCLR.CommaListConcatenate];


GO

