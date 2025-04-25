CREATE   PROCEDURE CreateFY_NY_SL_pp_depreciation_method_maintenance
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
    pp_depreciation_method_maintenance
(
    prop_val_yr
   ,pp_type_cd
   ,sic_cd
   ,dep_type_cd
   ,dep_deprec_cd
)
SELECT 
    @lCopyToYear
    ,prf.pp_type_cd
    ,prf.sic_cd
    ,prf.dep_type_cd
    ,prf.dep_deprec_cd
 FROM 
    pp_depreciation_method_maintenance as prf LEFT JOIN 
     (select @lInputFromYear as prop_val_yr,pp_type_cd,sic_cd
        from pp_depreciation_method_maintenance with (nolock) 
       where prop_val_yr = @lCopyToYear) as fy_prf
   on prf.prop_val_yr = fy_prf.prop_val_yr
 and prf.pp_type_cd = fy_prf.pp_type_cd
 and prf.sic_cd = fy_prf.sic_cd

  where prf.prop_val_yr = @lInputFromYear
 and fy_prf.prop_val_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO

