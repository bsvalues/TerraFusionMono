











CREATE     procedure CalculateTT

@input_entity_id	varchar(1000) = '',
@input_sup_num		int,
@input_yr		numeric(4),
@input_prop_id		int = 0,
@input_query		varchar(2000) = ''

as

SET QUOTED_IDENTIFIER OFF
set nocount on


declare @strSQL 	varchar(4092)

/****************************************************/
/******** create the temporary tables ***************/ 
/******** that will be needed	      ***************/
/****************************************************/

CREATE TABLE #property_val (
	prop_type_cd char (5)  NOT NULL ,
	prop_id int NOT NULL ,
	sup_num int not null  , 
	prop_val_yr numeric(4) not null , 
	market numeric(14, 0) NULL ,
	assessed_val numeric(14, 0) NULL ,
	appraised_val numeric(14, 0) NULL ,
	imprv_hstd_val numeric(14, 0) NULL ,
	imprv_non_hstd_val numeric(14, 0) NULL ,
	land_hstd_val numeric(14, 0) NULL ,
	land_non_hstd_val numeric(14, 0) NULL ,
	ten_percent_cap numeric(14, 0) NULL ,
	sup_action char (1)  NULL ,
	ag_use_val numeric(14, 0) NULL ,
	timber_use numeric(14, 0) NULL ,
	ag_market numeric(14, 0) NULL ,
	timber_market numeric(14, 0) NULL ,
	tif_imprv_val numeric(14, 0) NULL ,
	tif_land_val numeric(14, 0) NULL ,
	tif_flag char (1)  NULL ,
	owner_id int NOT NULL , 
	pct_ownership numeric(13, 10) NULL ,
	apply_pct_exemptions char (1) NULL ,
	ag_app_filed char (1)  NULL ,
	prop_inactive_dt datetime NULL,
	ag_late_loss	numeric(14,0) null
) 



ALTER TABLE #property_val WITH NOCHECK ADD 
	 PRIMARY KEY  CLUSTERED 
	(
		[prop_id],
		[prop_val_yr],
		[sup_num],
		[owner_id]
	) WITH  FILLFACTOR = 90  ON [PRIMARY] 


CREATE TABLE #entity_prop_assoc (
	prop_id int NOT NULL  ,
	sup_num int not null  ,
	tax_yr  numeric(4) not null , 
	entity_id int not null ,
	entity_prop_pct numeric(5, 2) null
) 


ALTER TABLE #entity_prop_assoc WITH NOCHECK ADD 
	 PRIMARY KEY  CLUSTERED 
	(
		[prop_id],
		[tax_yr],
		[sup_num],
		[entity_id]
	) WITH  FILLFACTOR = 90  ON [PRIMARY] 


CREATE TABLE #property_exemption (
	prop_id int NOT NULL   ,
	owner_id int NOT NULL  ,
	exmpt_tax_yr numeric(4, 0) NOT NULL ,
	owner_tax_yr numeric(4, 0) NOT NULL ,
	exmpt_type_cd char (5) NOT NULL ,
	effective_dt datetime NULL ,
	termination_dt datetime NULL ,
	apply_pct_owner numeric(5, 2) NULL ,
	sup_num int NOT NULL  ,
	effective_tax_yr numeric(4, 0) NULL ,
	use_freeze char (1)  NULL ,
	transfer_dt datetime NULL ,
	prev_tax_due numeric(14, 2) NULL ,
	prev_tax_nofrz numeric(14, 2) NULL ,
	freeze_yr numeric(4, 0) NULL ,
	freeze_ceiling numeric(14, 2) NULL ,
	qualify_yr numeric(4, 0) NULL ,
	sp_date_approved datetime NULL ,
	sp_expiration_date datetime NULL ,
	sp_value_type char (1)  NULL ,
	sp_value_option char (1)  NULL ,
	transfer_pct numeric(9, 6) NULL ,
	transfer_pct_override char (1)  NULL 
) 

ALTER TABLE #property_exemption WITH NOCHECK ADD 
	 PRIMARY KEY  CLUSTERED 
	(
		[prop_id],
		[owner_id],
		[sup_num],
		[exmpt_type_cd],
		[owner_tax_yr],
		[exmpt_tax_yr]
	) WITH  FILLFACTOR = 90  ON [PRIMARY] 


CREATE TABLE #entity_list (
	entity_id      int NOT NULL ,
	entity_type_cd varchar(5) NOT NULL
)


CREATE TABLE #property_val_state_cd (
	prop_id int NULL ,
	sup_num int NULL ,
	prop_val_yr numeric(4, 0) NULL ,
	state_cd char (5) NULL ,
	imprv_hstd_val numeric(14, 0) NULL ,
	imprv_non_hstd_val numeric(14, 0) NULL ,
	land_hstd_val numeric(14, 0) NULL ,
	land_non_hstd_val numeric(14, 0) NULL ,
	ag_use_val numeric(14, 0) NULL ,
	ag_market numeric(14, 0) NULL ,
	timber_use numeric(14, 0) NULL ,
	timber_market numeric(14, 0) NULL ,
	mineral_val numeric(14, 0) NULL ,
	personal_val numeric(14, 0) NULL ,
	appraised_val numeric(14, 0) NULL ,
	ten_percent_cap numeric(14, 0) NULL ,
	assessed_val numeric(14, 0) NULL ,
	market_val numeric(14, 0) NULL ,
	state_cd_pct numeric(9, 8) NULL ,

	imp_new_val numeric(14, 0) NULL ,
	acres numeric(18, 4) NULL ,
	pp_new_val numeric(14, 0) NULL ,
	land_new_val numeric(14, 0) NULL ,
	ag_acres numeric(18, 4) NULL ,
	effective_front numeric(18, 2) NULL 
) 

CREATE  CLUSTERED  INDEX [index_#property_val_state_cd] ON 
#property_val_state_cd
(prop_id, prop_val_yr, sup_num, state_cd) 
WITH  FILLFACTOR = 90 

/****************************************************/
/************* clear out existing fields ************/
/****************************************************/

if ((@input_prop_id <> 0) or (@input_query <> ''))
begin
	/* property_owner_entity_state_cd */
	set @strSQL = ' delete from property_owner_entity_state_cd' 
	set @strSQL = @strSQL + ' where year = ' + convert(varchar(4), @input_yr) 
	set @strSQL = @strSQL + ' and   sup_num = ' + convert(varchar(12), @input_sup_num)
	
	if (@input_prop_id <> 0)
	begin
		set @strSQL = @strSQL + ' and   prop_id = ' + convert(varchar(12), @input_prop_id)
	end
	else if (@input_query <> '')
	begin
		set @strSQL = @strSQL + ' and   prop_id in (' +  @input_query + ')'
	end
	
	if (@input_entity_id <> '')
	begin
		set @strSQL = @strSQL + ' and entity_id in (' + @input_entity_id + ')'
	end

	exec (@strSQL)
		
	/* property_entity_exemption */
	set @strSQL = ' delete from property_entity_exemption' 
	set @strSQL = @strSQL + ' where owner_tax_yr = ' + convert(varchar(4), @input_yr) 
	set @strSQL = @strSQL + ' and sup_num = ' + convert(varchar(12), @input_sup_num)

	if (@input_prop_id <> 0)
	begin
		set @strSQL = @strSQL + ' and   prop_id = ' + convert(varchar(12), @input_prop_id)
	end
	else if (@input_query <> '')
	begin
		set @strSQL = @strSQL + ' and   prop_id in (' +  @input_query + ')'
	end

	if (@input_entity_id <> '')
	begin
		set @strSQL = @strSQL + ' and entity_id in (' + @input_entity_id + ')'
	end

	exec (@strSQL)
	

	/* prop_owner_entity_val */
	set @strSQL = ' delete from prop_owner_entity_val' 
	set @strSQL = @strSQL + ' where sup_yr = ' + convert(varchar(4), @input_yr) 
	set @strSQL = @strSQL + ' and sup_num = '  + convert(varchar(12), @input_sup_num) 
	
	if (@input_prop_id <> 0)
	begin
		set @strSQL = @strSQL + ' and   prop_id = ' + convert(varchar(12), @input_prop_id)
	end
	else if (@input_query <> '')
	begin
		set @strSQL = @strSQL + ' and   prop_id in (' +  @input_query + ')'
	end
	
	if (@input_entity_id <> '')
	begin
		set @strSQL = @strSQL + ' and entity_id in (' + @input_entity_id + ')'
	end

	exec (@strSQL)
end
else
begin
	set @strSQL = ' delete from property_owner_entity_state_cd'
	set @strSQL = @strSQL + ' from property_val' 
	set @strSQL = @strSQL + ' where property_val.prop_id = property_owner_entity_state_cd.prop_id'
	set @strSQL = @strSQL + ' and    property_val.sup_num = property_owner_entity_state_cd.sup_num'
	set @strSQL = @strSQL + ' and    property_val.prop_val_yr = property_owner_entity_state_cd.year' 
	set @strSQL = @strSQL + ' and    property_owner_entity_state_cd.year = ' + convert(varchar(4), @input_yr) 
	set @strSQL = @strSQL + ' and    property_owner_entity_state_cd.sup_num = ' + convert(varchar(12), @input_sup_num) 
	set @strSQL = @strSQL + ' and    property_val.accept_create_id is null'
	
	if (@input_entity_id <> '')
	begin
		set @strSQL = @strSQL + ' and property_owner_entity_state_cd.entity_id in (' + @input_entity_id + ')'
	end

	exec (@strSQL)

	set @strSQL = ' delete from property_entity_exemption' 
	set @strSQL = @strSQL + ' from property_val' 
	set @strSQL = @strSQL + ' where property_val.prop_id = property_entity_exemption.prop_id'
	set @strSQL = @strSQL + ' and    property_val.sup_num = property_entity_exemption.sup_num'
	set @strSQL = @strSQL + ' and    property_val.prop_val_yr = property_entity_exemption.owner_tax_yr' 
	set @strSQL = @strSQL + ' and    property_entity_exemption.owner_tax_yr = ' + convert(varchar(4), @input_yr) 
	set @strSQL = @strSQL + ' and    property_entity_exemption.sup_num = ' + convert(varchar(12), @input_sup_num ) 
	set @strSQL = @strSQL + ' and    property_val.accept_create_id is null'

	if (@input_entity_id <> '')
	begin
		set @strSQL = @strSQL + ' and property_entity_exemption.entity_id in (' + @input_entity_id + ')'
	end

	exec (@strSQL)

	set @strSQL = 'delete from prop_owner_entity_val' 
	set @strSQL = @strSQL + ' from property_val' 
	set @strSQL = @strSQL + ' where prop_owner_entity_val.prop_id = property_val.prop_id'
	set @strSQL = @strSQL + ' and    prop_owner_entity_val.sup_num = property_val.sup_num'
	set @strSQL = @strSQL + ' and    prop_owner_entity_val.sup_yr     = property_val.prop_val_yr'
	set @strSQL = @strSQL + ' and    prop_owner_entity_val.sup_yr = ' + convert(varchar(4), @input_yr) 
	set @strSQL = @strSQL + ' and    prop_owner_entity_val.sup_num = ' + convert(varchar(12), @input_sup_num)                  
	set @strSQL = @strSQL + ' and    property_val.accept_create_id is null'

		
	if (@input_entity_id <> '')
	begin
		set @strSQL = @strSQL + ' and prop_owner_entity_val.entity_id in (' + @input_entity_id + ')'
	end

	exec (@strSQL)
end


/****************************************************/
/************** build #entity_list ******************/
/****************************************************/

set @strSQL = 'insert into #entity_list '
set @strSQL = @strSQL + 'select entity_id, entity_type_cd'
set @strSQL = @strSQL + ' from entity '

if (@input_entity_id <> '')
begin
	set @strSQL = @strSQL + ' where entity_id in (' + @input_entity_id + ')'
end

exec (@strSQL)


/****************************************************/
/*************** build #property info ***************/
/****************************************************/

set @strSQL = 'insert into #property_val '
set @strSQL = @strSQL + ' select property.prop_type_cd,'
set @strSQL = @strSQL + ' property_val.prop_id,'
set @strSQL = @strSQL + ' property_val.sup_num,'
set @strSQL = @strSQL + ' property_val.prop_val_yr,'
set @strSQL = @strSQL + ' property_val.market,'
set @strSQL = @strSQL + ' property_val.assessed_val,'
set @strSQL = @strSQL + ' property_val.appraised_val,'
set @strSQL = @strSQL + ' property_val.imprv_hstd_val,'
set @strSQL = @strSQL + ' property_val.imprv_non_hstd_val,'
set @strSQL = @strSQL + ' property_val.land_hstd_val,'
set @strSQL = @strSQL + ' property_val.land_non_hstd_val,'
set @strSQL = @strSQL + ' property_val.ten_percent_cap,'
set @strSQL = @strSQL + ' property_val.sup_action,'
set @strSQL = @strSQL + ' property_val.ag_use_val,'
set @strSQL = @strSQL + ' property_val.timber_use,'
set @strSQL = @strSQL + ' property_val.ag_market,'
set @strSQL = @strSQL + ' property_val.timber_market,'
set @strSQL = @strSQL + ' property_val.tif_imprv_val,'
set @strSQL = @strSQL + ' property_val.tif_land_val,'
set @strSQL = @strSQL + ' property_val.tif_flag,'
set @strSQL = @strSQL + ' owner.owner_id,'
set @strSQL = @strSQL + ' owner.pct_ownership,'
set @strSQL = @strSQL + ' owner.apply_pct_exemptions,'
set @strSQL = @strSQL + ' owner.ag_app_filed,'
set @strSQL = @strSQL + ' property_val.prop_inactive_dt,'
set @strSQL = @strSQL + ' property_val.ag_late_loss'
set @strSQL = @strSQL + ' from property_val,'
set @strSQL = @strSQL + '     property,'
set @strSQL = @strSQL + '     owner'
set @strSQL = @strSQL + ' where property_val.prop_id     = property.prop_id'
set @strSQL = @strSQL + ' and   property_val.prop_id     = owner.prop_id'
set @strSQL = @strSQL + ' and   property_val.sup_num     = owner.sup_num'
set @strSQL = @strSQL + ' and   property_val.prop_val_yr = owner.owner_tax_yr'
set @strSQL = @strSQL + ' and   property_val.prop_val_yr = ' + convert(varchar(4), @input_yr)
set @strSQL = @strSQL + ' and   property_val.sup_num     = ' + convert(varchar(10), @input_sup_num)
set @strSQL = @strSQL + ' and   property_val.accept_create_id is null '

if (@input_prop_id <> 0)
begin
	set @strSQL = @strSQL + ' and property_val.prop_id = ' + convert(varchar(15), @input_prop_id)
end

if (@input_query <> '')
begin
	set @strSQL = @strSQL + ' and property_val.prop_id in (' +  @input_query + ')'
end


exec (@strSQL)




/****************************************************/
/*************** build #entity info *****************/
/****************************************************/

set @strSQL = 'insert into #entity_prop_assoc '
set @strSQL = @strSQL + ' select entity_prop_assoc.prop_id,' 
set @strSQL = @strSQL + ' entity_prop_assoc.sup_num,' 
set @strSQL = @strSQL + ' entity_prop_assoc.tax_yr,'
set @strSQL = @strSQL + ' entity_prop_assoc.entity_id, '
set @strSQL = @strSQL + ' entity_prop_assoc.entity_prop_pct '
set @strSQL = @strSQL + ' from entity_prop_assoc, #entity_list '
set @strSQL = @strSQL + ' where entity_prop_assoc.entity_id = #entity_list.entity_id '
set @strSQL = @strSQL + ' and   entity_prop_assoc.tax_yr = '  + convert(varchar(4), @input_yr)
set @strSQL = @strSQL + ' and   entity_prop_assoc.sup_num = ' + convert(varchar(10), @input_sup_num)


if (@input_prop_id <> 0)
begin
	set @strSQL = @strSQL + ' and entity_prop_assoc.prop_id = ' + convert(varchar(15), @input_prop_id)
end

if (@input_query <> '')
begin
	set @strSQL = @strSQL + ' and entity_prop_assoc.prop_id in (' +  @input_query + ')'
end

exec (@strSQL)



/****************************************************/
/*************** build #exemption info **************/
/****************************************************/

set @strSQL = 'insert into #property_exemption '
set @strSQL = @strSQL + ' select ' 
set @strSQL = @strSQL + ' prop_id,'
set @strSQL = @strSQL + ' owner_id,' 
set @strSQL = @strSQL + ' exmpt_tax_yr,'
set @strSQL = @strSQL + ' owner_tax_yr,'
set @strSQL = @strSQL + ' exmpt_type_cd,'
set @strSQL = @strSQL + ' effective_dt,'
set @strSQL = @strSQL + ' termination_dt,'
set @strSQL = @strSQL + ' apply_pct_owner,'
set @strSQL = @strSQL + ' sup_num,'
set @strSQL = @strSQL + ' effective_tax_yr,'
set @strSQL = @strSQL + ' use_freeze,'
set @strSQL = @strSQL + ' transfer_dt,'
set @strSQL = @strSQL + ' prev_tax_due,'
set @strSQL = @strSQL + ' prev_tax_nofrz,'
set @strSQL = @strSQL + ' freeze_yr,'
set @strSQL = @strSQL + ' freeze_ceiling,'
set @strSQL = @strSQL + ' qualify_yr,'
set @strSQL = @strSQL + ' sp_date_approved,'
set @strSQL = @strSQL + ' sp_expiration_date,'
set @strSQL = @strSQL + ' sp_value_type,'
set @strSQL = @strSQL + ' sp_value_option,'
set @strSQL = @strSQL + ' transfer_pct,'
set @strSQL = @strSQL + ' transfer_pct_override' 
set @strSQL = @strSQL + ' from property_exemption '
set @strSQL = @strSQL + ' where property_exemption.owner_tax_yr = ' + convert(varchar(4), @input_yr)
set @strSQL = @strSQL + ' and   property_exemption.sup_num = '      + convert(varchar(10), @input_sup_num)

if (@input_prop_id <> 0)
begin
	set @strSQL = @strSQL + ' and property_exemption.prop_id = ' + convert(varchar(15), @input_prop_id)
end


if (@input_query <> '')
begin
	set @strSQL = @strSQL + ' and property_exemption.prop_id in (' +  @input_query + ')'
end

exec (@strSQL)

/****************************************************/
/******* build initial state code ields *************/
/****************************************************/

set @strSQL = 'exec PopulatePropertyValStateCd '
set @strSQL = @strSQL + convert(varchar(4), @input_yr) + ', '
set @strSQL = @strSQL + convert(varchar(10), @input_sup_num)

if (@input_prop_id <> 0)
begin
	set @strSQL = @strSQL + ', ' + convert(varchar(15), @input_prop_id)
end


if (@input_query <> '')
begin
	declare @temp_query	varchar(2000)

	set @temp_query = @input_query
	set @temp_query = replace(@temp_query, '"', '''')
	set @temp_query = replace(@temp_query, '''', '''''')

	set @strSQL = @strSQL + ', 0, 0, ' + '''' + @temp_query + ''''
end


exec (@strSQL)


set @strSQL = 'insert into #property_val_state_cd '
set @strSQL = @strSQL + ' select  * ' 
set @strSQL = @strSQL + ' from property_val_state_cd '
set @strSQL = @strSQL + ' where property_val_state_cd.prop_val_yr = ' + convert(varchar(4), @input_yr)
set @strSQL = @strSQL + ' and   property_val_state_cd.sup_num = '              + convert(varchar(10), @input_sup_num)

if (@input_prop_id <> 0)
begin
	set @strSQL = @strSQL + ' and property_val_state_cd.prop_id = ' + convert(varchar(15), @input_prop_id)
end

if (@input_query <> '')
begin
	set @strSQL = @strSQL + ' and property_val_state_cd.prop_id in (' +  @input_query + ')'
end

exec (@strSQL)

/****************************************************/
/*********** rebuild the indexes ********************/
/****************************************************/
if (@input_prop_id = 0)
begin
	dbcc dbreindex(#property_val, '', 70)
	dbcc dbreindex(#entity_prop_assoc, '', 70)
	dbcc dbreindex(#property_exemption, '', 70)
--	dbcc dbreindex(#entity_list, '', 70)
	dbcc dbreindex(#property_val_state_cd, '', 70)
end


/****************************************************/
/*********** calculate entity taxable ***************/
/****************************************************/

declare @entity_cursor_id	int
declare @entity_type		varchar(5)

DECLARE ENTITY SCROLL CURSOR
FOR select entity_id,
	   entity_type_cd
    from   #entity_list

OPEN ENTITY
FETCH NEXT FROM ENTITY into @entity_cursor_id, @entity_type

while (@@FETCH_STATUS = 0)
begin

	if (@entity_type <> 'R' or @entity_type is null)
	begin
		set @strSQL = 'SetEntityExmptValue ' 
	end
	else
	begin
		set @strSQL = 'SetRBEntityExmptValue '
	end

	set @strSQL = @strSQL + convert(varchar(4), @input_yr) 
	set @strSQL = @strSQL + ', ' + convert(varchar(10), @input_sup_num) 
	set @strSQL = @strSQL + ', ' + convert(varchar(15), @entity_cursor_id)
	
	exec (@strSQL)

	FETCH NEXT FROM ENTITY into @entity_cursor_id, @entity_type

	

end

close ENTITY
deallocate ENTITY



drop table #property_val
drop table #entity_prop_assoc
drop table #property_exemption
drop table #entity_list
drop table #property_val_state_cd

GO

