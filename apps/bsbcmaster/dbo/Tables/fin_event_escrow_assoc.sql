CREATE TABLE [dbo].[fin_event_escrow_assoc] (
    [fin_account_id]     INT          NOT NULL,
    [event_cd]           VARCHAR (15) NOT NULL,
    [action]             BIT          NOT NULL,
    [escrow_type_cd]     VARCHAR (20) NOT NULL,
    [is_primary_account] BIT          NULL,
    [year]               NUMERIC (4)  NOT NULL,
    CONSTRAINT [CPK_fin_event_escrow_assoc] PRIMARY KEY CLUSTERED ([fin_account_id] ASC, [event_cd] ASC, [action] ASC, [year] ASC, [escrow_type_cd] ASC),
    CONSTRAINT [CFK_fin_event_escrow_assoc_event_cd] FOREIGN KEY ([event_cd]) REFERENCES [dbo].[fin_event_code] ([event_cd]),
    CONSTRAINT [CFK_fin_event_escrow_assoc_fin_account_id] FOREIGN KEY ([fin_account_id]) REFERENCES [dbo].[fin_account] ([fin_account_id]),
    CONSTRAINT [CFK_fin_event_escrow_assoc_year_escrow_type_cd] FOREIGN KEY ([year], [escrow_type_cd]) REFERENCES [dbo].[escrow_type] ([year], [escrow_type_cd]) ON DELETE CASCADE
);


GO

 
create trigger tr_fin_event_escrow_assoc_update_ChangeLog
on fin_event_escrow_assoc
for update
not for replication
as
 
if ( @@rowcount = 0 )
begin
     return
end
 
set nocount on
 
declare @tvar_lLogChanges int
declare @tvar_lPacsUserID int
exec GetMachineLogChanges @tvar_lLogChanges output, @tvar_lPacsUserID output
if ( @tvar_lLogChanges = 0 )
begin
     return
end
 
declare @tvar_dtNow datetime
set @tvar_dtNow = getdate()
 
declare @tvar_lChangeID int
 
declare @tvar_lFutureYear int
declare @tvar_key_year int
select @tvar_lFutureYear = future_yr, @tvar_key_year = appr_yr
from pacs_system with(nolock)
if ( @tvar_lFutureYear is null )
begin
     set @tvar_lFutureYear = 0
end
 
declare @tvar_intMin numeric(28,0)
declare @tvar_intMax numeric(28,0)
set @tvar_intMin = -2147483649
set @tvar_intMax = 2147483648
 
declare @tvar_szRefID varchar(255)
 
declare @tvar_key_prop_id int
 
declare @old_fin_account_id int
declare @new_fin_account_id int
declare @old_event_cd varchar(10)
declare @new_event_cd varchar(10)
declare @old_action bit
declare @new_action bit
declare @old_escrow_type_cd varchar(20)
declare @new_escrow_type_cd varchar(20)
declare @old_is_primary_account bit
declare @new_is_primary_account bit
declare @old_year numeric(4,0)
declare @new_year numeric(4,0)
 
declare curRows cursor
for
     select d.fin_account_id, d.event_cd, d.action, d.escrow_type_cd, d.is_primary_account, d.year, i.fin_account_id, i.event_cd, i.action, i.escrow_type_cd, i.is_primary_account, i.year
from deleted as d
join inserted as i on 
     d.fin_account_id = i.fin_account_id and
     d.event_cd = i.event_cd and
     d.action = i.action and
     d.escrow_type_cd = i.escrow_type_cd and
     d.year = i.year
for read only
 
open curRows
fetch next from curRows into @old_fin_account_id, @old_event_cd, @old_action, @old_escrow_type_cd, @old_is_primary_account, @old_year, @new_fin_account_id, @new_event_cd, @new_action, @new_escrow_type_cd, @new_is_primary_account, @new_year
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = cast(@old_year as varchar) + '-' + @old_escrow_type_cd + '-' + @old_event_cd
 
     if (
          @old_fin_account_id <> @new_fin_account_id
          or
          ( @old_fin_account_id is null and @new_fin_account_id is not null ) 
          or
          ( @old_fin_account_id is not null and @new_fin_account_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'fin_event_escrow_assoc' and
                    chg_log_columns = 'fin_account_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1198, 9483, convert(varchar(255), @old_fin_account_id), convert(varchar(255), @new_fin_account_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9487, convert(varchar(24), @new_escrow_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_event_cd <> @new_event_cd
          or
          ( @old_event_cd is null and @new_event_cd is not null ) 
          or
          ( @old_event_cd is not null and @new_event_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'fin_event_escrow_assoc' and
                    chg_log_columns = 'event_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1198, 1785, convert(varchar(255), @old_event_cd), convert(varchar(255), @new_event_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9487, convert(varchar(24), @new_escrow_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_action <> @new_action
          or
          ( @old_action is null and @new_action is not null ) 
          or
          ( @old_action is not null and @new_action is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'fin_event_escrow_assoc' and
                    chg_log_columns = 'action' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1198, 52, convert(varchar(255), @old_action), convert(varchar(255), @new_action), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9487, convert(varchar(24), @new_escrow_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_escrow_type_cd <> @new_escrow_type_cd
          or
          ( @old_escrow_type_cd is null and @new_escrow_type_cd is not null ) 
          or
          ( @old_escrow_type_cd is not null and @new_escrow_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'fin_event_escrow_assoc' and
                    chg_log_columns = 'escrow_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1198, 9487, convert(varchar(255), @old_escrow_type_cd), convert(varchar(255), @new_escrow_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9487, convert(varchar(24), @new_escrow_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_is_primary_account <> @new_is_primary_account
          or
          ( @old_is_primary_account is null and @new_is_primary_account is not null ) 
          or
          ( @old_is_primary_account is not null and @new_is_primary_account is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'fin_event_escrow_assoc' and
                    chg_log_columns = 'is_primary_account' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1198, 9490, convert(varchar(255), @old_is_primary_account), convert(varchar(255), @new_is_primary_account), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9487, convert(varchar(24), @new_escrow_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_year <> @new_year
          or
          ( @old_year is null and @new_year is not null ) 
          or
          ( @old_year is not null and @new_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'fin_event_escrow_assoc' and
                    chg_log_columns = 'year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1198, 5550, convert(varchar(255), @old_year), convert(varchar(255), @new_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @new_fin_account_id), @new_fin_account_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @new_event_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @new_action), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9487, convert(varchar(24), @new_escrow_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_fin_account_id, @old_event_cd, @old_action, @old_escrow_type_cd, @old_is_primary_account, @old_year, @new_fin_account_id, @new_event_cd, @new_action, @new_escrow_type_cd, @new_is_primary_account, @new_year
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_fin_event_escrow_assoc_delete_ChangeLog
on fin_event_escrow_assoc
for delete
not for replication
as
 
if ( @@rowcount = 0 )
begin
     return
end
 
set nocount on
 
declare @tvar_lLogChanges int
declare @tvar_lPacsUserID int
exec GetMachineLogChanges @tvar_lLogChanges output, @tvar_lPacsUserID output
if ( @tvar_lLogChanges = 0 )
begin
     return
end
 
if not exists (
     select chg_log_audit
     from chg_log_columns with(nolock)
     where
          chg_log_tables = 'fin_event_escrow_assoc' and
          chg_log_audit = 1
)
begin
     return
end
 
declare @tvar_dtNow datetime
set @tvar_dtNow = getdate()
 
declare @tvar_lChangeID int
 
declare @tvar_lFutureYear int
declare @tvar_key_year int
select @tvar_lFutureYear = future_yr, @tvar_key_year = appr_yr
from pacs_system with(nolock)
if ( @tvar_lFutureYear is null )
begin
     set @tvar_lFutureYear = 0
end
 
declare @tvar_intMin numeric(28,0)
declare @tvar_intMax numeric(28,0)
set @tvar_intMin = -2147483649
set @tvar_intMax = 2147483648
 
declare @tvar_szRefID varchar(255)
declare @tvar_szOldValue varchar(255)
set @tvar_szOldValue = 'DELETED'
 
declare @tvar_key_prop_id int
 
declare @fin_account_id int
declare @event_cd varchar(15)
declare @action bit
declare @escrow_type_cd varchar(20)
declare @year numeric(4,0)
 
declare curRows cursor
for
     select fin_account_id, event_cd, action, escrow_type_cd, year from deleted
for read only
 
open curRows
fetch next from curRows into @fin_account_id, @event_cd, @action, @escrow_type_cd, @year
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = cast(@year as varchar) + '-' + @escrow_type_cd + '-' + @event_cd
		set @tvar_szOldValue = cast(@fin_account_id as varchar)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1198, 9483, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9487, convert(varchar(24), @escrow_type_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
 
     fetch next from curRows into @fin_account_id, @event_cd, @action, @escrow_type_cd, @year
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_fin_event_escrow_assoc_insert_ChangeLog
on fin_event_escrow_assoc
for insert
not for replication
as
 
if ( @@rowcount = 0 )
begin
     return
end
 
set nocount on
 
declare @tvar_lLogChanges int
declare @tvar_lPacsUserID int
exec GetMachineLogChanges @tvar_lLogChanges output, @tvar_lPacsUserID output
if ( @tvar_lLogChanges = 0 )
begin
     return
end
 
declare @tvar_dtNow datetime
set @tvar_dtNow = getdate()
 
declare @tvar_lChangeID int
 
declare @tvar_lFutureYear int
declare @tvar_key_year int
select @tvar_lFutureYear = future_yr, @tvar_key_year = appr_yr
from pacs_system with(nolock)
if ( @tvar_lFutureYear is null )
begin
     set @tvar_lFutureYear = 0
end
 
declare @tvar_intMin numeric(28,0)
declare @tvar_intMax numeric(28,0)
set @tvar_intMin = -2147483649
set @tvar_intMax = 2147483648
 
declare @tvar_szRefID varchar(255)
 
declare @tvar_key_prop_id int
 
declare @fin_account_id int
declare @event_cd varchar(10)
declare @action bit
declare @escrow_type_cd varchar(20)
declare @is_primary_account bit
declare @year numeric(4,0)
 
declare curRows cursor
for
     select fin_account_id, event_cd, action, escrow_type_cd, is_primary_account, year from inserted
for read only
 
open curRows
fetch next from curRows into @fin_account_id, @event_cd, @action, @escrow_type_cd, @is_primary_account, @year
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = cast(@year as varchar) + '-' + @escrow_type_cd + '-' + @event_cd
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_escrow_assoc' and
               chg_log_columns = 'fin_account_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1198, 9483, null, convert(varchar(255), @fin_account_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9487, convert(varchar(24), @escrow_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_escrow_assoc' and
               chg_log_columns = 'event_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1198, 1785, null, convert(varchar(255), @event_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9487, convert(varchar(24), @escrow_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_escrow_assoc' and
               chg_log_columns = 'action' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1198, 52, null, convert(varchar(255), @action), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9487, convert(varchar(24), @escrow_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_escrow_assoc' and
               chg_log_columns = 'escrow_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1198, 9487, null, convert(varchar(255), @escrow_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9487, convert(varchar(24), @escrow_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_escrow_assoc' and
               chg_log_columns = 'is_primary_account' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1198, 9490, null, convert(varchar(255), @is_primary_account), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9487, convert(varchar(24), @escrow_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'fin_event_escrow_assoc' and
               chg_log_columns = 'year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1198, 5550, null, convert(varchar(255), @year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9483, convert(varchar(24), @fin_account_id), @fin_account_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1785, convert(varchar(24), @event_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 52, convert(varchar(24), @action), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9487, convert(varchar(24), @escrow_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @fin_account_id, @event_cd, @action, @escrow_type_cd, @is_primary_account, @year
end
 
close curRows
deallocate curRows

GO

