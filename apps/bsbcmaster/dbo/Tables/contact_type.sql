CREATE TABLE [dbo].[contact_type] (
    [contact_type_cd]   VARCHAR (10) NOT NULL,
    [contact_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_contact_type] PRIMARY KEY CLUSTERED ([contact_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger [dbo].[tr_contact_type_delete_insert_update_MemTable]
on [dbo].[contact_type]
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
where szTableName = 'contact_type'

GO

