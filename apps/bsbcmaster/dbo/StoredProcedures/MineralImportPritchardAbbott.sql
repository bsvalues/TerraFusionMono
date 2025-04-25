



create procedure dbo.MineralImportPritchardAbbott
	@run_id int,
	@year numeric(4),
	@appr_company_id int,
	@user_id int,
	@input_file varchar(255),
	@agent_file varchar(255)
as


insert into
	mineral_import
(
	run_id,
	year,
	appr_company_id
)
values
(
	@run_id,
	@year,
	@appr_company_id
)


insert into
	mineral_import_status
(
	run_id,
	status_code,
	status_user_id,
	status_date
)
values
(
	@run_id,
	'IMPORT',
	@user_id,
	GetDate()
)


exec MineralImportPritchardAbbottAgent @run_id, @year, @appr_company_id, @agent_file
exec MineralImportPritchardAbbottStaging @run_id, @year, @appr_company_id, @input_file
exec MineralImportPritchardAbbottCommon @run_id, @year, @appr_company_id

GO

