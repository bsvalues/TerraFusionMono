CREATE   PROCEDURE CreateFY_NY_SL_comp_sales_point_cva
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
    comp_sales_point_cva
(
    lPointDiff
   ,lPoints
   ,lYear
)
SELECT 
    cspc.lPointDiff
    ,cspc.lPoints
    ,@lCopyToYear
 FROM 
    comp_sales_point_cva as cspc LEFT JOIN 
     (select @lInputFromYear as lYear,lPointDiff
        from comp_sales_point_cva with (nolock) 
       where lYear = @lCopyToYear) as fy_cspc
   on cspc.lYear = fy_cspc.lYear
 and cspc.lPointDiff = fy_cspc.lPointDiff

  where cspc.lYear = @lInputFromYear
 and fy_cspc.lYear is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

