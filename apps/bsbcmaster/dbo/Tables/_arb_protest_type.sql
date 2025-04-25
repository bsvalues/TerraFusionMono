CREATE TABLE [dbo].[_arb_protest_type] (
    [protest_type_cd]   VARCHAR (10) NOT NULL,
    [protest_type_desc] VARCHAR (50) NULL,
    [sys_flag]          CHAR (1)     CONSTRAINT [CDF__arb_protest_type_sys_flag] DEFAULT ('F') NULL,
    CONSTRAINT [CPK__arb_protest_type] PRIMARY KEY CLUSTERED ([protest_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr__arb_protest_type_delete_insert_update_MemTable
on _arb_protest_type
for delete, insert, update
not for replication
as
 
if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on
 
update table_cache_status with(rowlock)
set lDummy = 0
where szTableName = '_arb_protest_type'

GO

