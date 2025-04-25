
create procedure RecalcRowUpdateExemptionAssocImprovement
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int,
	@lImprovID int,
	@lOwnerID int,
	@lEntityID int,
	@szExemptTypeCode varchar(10),

	@calc_amount numeric(14,0)
as

set nocount on

	update imprv_exemption_assoc with(rowlock)
	set
		calc_amount = @calc_amount
	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		sale_id = @lSaleID and
		imprv_id = @lImprovID and
		owner_id = @lOwnerID and
		entity_id = @lEntityID and
		exmpt_type_cd = @szExemptTypeCode

GO

