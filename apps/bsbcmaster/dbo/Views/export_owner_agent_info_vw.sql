



CREATE  VIEW export_owner_agent_info_vw

AS

SELECT DISTINCT current_account_id,
				current_name,
				current_addr1,
				current_addr2,
				current_addr3,
				current_city,
				current_state,	
				current_zip,
				change_reason,
				cast(convert(varchar(10), chg_dt, 101) as datetime) as chg_dt,
				cast(convert(varchar(10), ownership_chg_dt, 101) as datetime) as ownership_chg_dt,
				cast(convert(varchar(10), address_chg_dt, 101) as datetime) as address_chg_dt,
				record_type
FROM oa_change_info

GO

