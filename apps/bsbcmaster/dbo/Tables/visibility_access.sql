CREATE TABLE [dbo].[visibility_access] (
    [visibility_access_cd]   VARCHAR (10) NOT NULL,
    [visibility_access_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_visibility_access] PRIMARY KEY CLUSTERED ([visibility_access_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_visibility_access_delete_insert_update_MemTable
on visibility_access
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
where szTableName = 'visibility_access'

GO

