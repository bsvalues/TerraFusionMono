
create procedure LayerDeleteUserTablePropertyVal
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int
as

set nocount on

	delete dbo.user_property_val with(rowlock)
	where
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		prop_id = @lPropID

GO

