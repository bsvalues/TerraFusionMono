
create procedure sp_ScriptSingleTablePrimaryKey
	@TableName varchar(255),
    @szSQL varchar(8000) output,
    @IncludeNotExistsLogic bit = 1
as

set nocount on


	declare curPrimaryKeys insensitive cursor
	for
		select
			t_tables.name,
			si.name,
			t_tables.id as lTableID,
			si.indid as lIndexID,
			si.OrigFillFactor,
			sfg.groupname as szFileGroupName
		from sysobjects as t_primarykeys
		join sysobjects as t_tables on
			t_primarykeys.parent_obj = t_tables.id
		join sysindexes as si on
			t_primarykeys.name = si.name
		join sysfilegroups as sfg on
			si.groupid = sfg.groupid
		where
			t_primarykeys.xtype = 'PK' and /* Only primary key constraints */
			t_tables.xtype = 'U' and /* Not system tables */
			objectproperty(t_tables.id, 'IsMSShipped') = 0 and
			t_tables.name = @TableName

	for read only

	/* For processing the primary keys cursor */
	declare
		@szTableName sysname,
		@szIndexName sysname,
		@lTableID int,
		@lIndexID smallint,
		@lFillFactor tinyint,
		@szFileGroupName sysname

	/* For processing the primay key columns cursor */
	declare @szColumnName sysname

	/* To determine if we must add a comma in our SQL */
	declare @lCount int
    set @szSQL = ''
	/* SQL for creating a primary key constraint */
	

	open curPrimaryKeys
	fetch next from curPrimaryKeys
	into
		@szTableName,
		@szIndexName,
		@lTableID,
		@lIndexID,
		@lFillFactor,
		@szFileGroupName

	/* For each primary key */
	while @@fetch_status = 0
	begin
		/* Begin building SQL */
        if @IncludeNotExistsLogic = 1
           begin
			set @szSQL = @szSQL + ' IF NOT EXISTS(SELECT so.name from sysobjects as so '
					+ ' WHERE  so.parent_obj = object_id('''+ @TableName + ''')'
					+ ' and so.name = ''' + @szIndexName + ''')'
					+ '   BEGIN '
           end

		set @szSQL = @szSQL +
			'alter table ' + @szTableName + ' add constraint ' +
			@szIndexName + ' primary key '
		if @lIndexID = 1
		begin
			set @szSQL = @szSQL + 'clustered ('
		end
		else
		begin
			set @szSQL = @szSQL + 'nonclustered ('
		end

		declare curPKColumns insensitive cursor
		for
			select
				sc.name
			from sysindexkeys as sik
			join syscolumns as sc on
				sik.id = sc.id and
				sik.colid = sc.colid
			where
				sik.id = @lTableID and
				sik.indid = @lIndexID
			order by
				sik.keyno asc
		for read only

		open curPKColumns
		fetch next from curPKColumns
		into
			@szColumnName

		set @lCount = 0

		/* For each column */
		while @@fetch_status = 0
		begin
			if @lCount > 0
			begin
				set @szSQL = @szSQL + ', '
			end

			set @lCount = @lCount + 1

			set @szSQL = @szSQL + '[' + @szColumnName + ']'

			fetch next from curPKColumns
			into
				@szColumnName
		end

		close curPKColumns
		deallocate curPKColumns

		/* Finish building SQL */
		set @szSQL = @szSQL + ')'

		if ( @lFillFactor > 0 )
		begin
			set @szSQL = @szSQL + ' with fillfactor = ' + convert(varchar(3), @lFillFactor)
		end
		
		set @szSQL = @szSQL + ' on [primary] '
		--set @szSQL = @szSQL + ' on [' + @szFileGroupName + ']'
        if @IncludeNotExistsLogic = 1
           begin
              set @szSQL = @szSQL +'   END '
		   end

		--print @szSQL
		--print 'go'
		--print ''

		fetch next from curPrimaryKeys
		into
			@szTableName,
			@szIndexName,
			@lTableID,
			@lIndexID,
			@lFillFactor,
			@szFileGroupName
	end

	close curPrimaryKeys
	deallocate curPrimaryKeys

set nocount off

GO

