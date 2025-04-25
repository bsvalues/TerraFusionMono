CREATE   PROCEDURE CreateFY_NY_SL_comp_sales_corp_score_cva
	@lInputFromYear numeric(4,0),
    @lCopyToYear numeric(4,0),
    @CalledBy varchar(10) 
 
AS
 
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @Rows int
DECLARE @qry varchar(255)
 declare @proc varchar(500)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc + ' ' + convert(char(4),@lInputFromYear)
         + ',' + convert(char(4),@lCopyToYear) + ',' + @CalledBy
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
/* End top of each procedure to capture parameters */
INSERT INTO 
    comp_sales_corp_score_cva
(
    szCVA
   ,lPoints
   ,lYear
)
SELECT 
    csc.szCVA
    ,csc.lPoints
    ,@lCopyToYear
 FROM 
    comp_sales_corp_score_cva as csc LEFT JOIN 
     (select @lInputFromYear as lYear,szCVA
        from comp_sales_corp_score_cva with (nolock) 
       where lYear = @lCopyToYear) as fy_csc
   on csc.lYear = fy_csc.lYear
 and csc.szCVA = fy_csc.szCVA

  where csc.lYear = @lInputFromYear
 and fy_csc.lYear is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

