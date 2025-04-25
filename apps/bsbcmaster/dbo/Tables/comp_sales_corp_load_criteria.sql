CREATE TABLE [dbo].[comp_sales_corp_load_criteria] (
    [lPacsUserID]                 INT           NOT NULL,
    [bQuality]                    BIT           NOT NULL,
    [bSubmarket]                  BIT           NOT NULL,
    [bPropertyUse]                BIT           NOT NULL,
    [bCVA]                        BIT           NOT NULL,
    [bAge]                        BIT           NOT NULL,
    [lAgeRange]                   INT           NOT NULL,
    [bBldgArea]                   BIT           NOT NULL,
    [lBldgAreaRange]              INT           NOT NULL,
    [bLandArea]                   BIT           NOT NULL,
    [lLandAreaRange]              INT           NOT NULL,
    [bNumUnits]                   BIT           NOT NULL,
    [lNumUnitsRange]              INT           NOT NULL,
    [bSaleDateRange]              BIT           NOT NULL,
    [szSaleRatioCodes]            VARCHAR (32)  NULL,
    [bEffectiveAge]               BIT           NOT NULL,
    [lEffectiveAgeRange]          INT           NOT NULL,
    [bNRA]                        BIT           NOT NULL,
    [lNRARange]                   INT           NOT NULL,
    [bRegion]                     BIT           NOT NULL,
    [bAbsSubdivision]             BIT           NOT NULL,
    [bNeighborhood]               BIT           NOT NULL,
    [bSubset]                     BIT           NOT NULL,
    [bSchool]                     BIT           NOT NULL,
    [bCity]                       BIT           NOT NULL,
    [bStateCode]                  BIT           NOT NULL,
    [bPGI]                        BIT           NOT NULL,
    [lPGIRange]                   INT           NOT NULL,
    [bEGI]                        BIT           NOT NULL,
    [lEGIRange]                   INT           NOT NULL,
    [bNOI]                        BIT           NOT NULL,
    [lNOIRange]                   INT           NOT NULL,
    [bEXP]                        BIT           NOT NULL,
    [lEXPRange]                   INT           NOT NULL,
    [bVacancy]                    BIT           NOT NULL,
    [lVacancyRange]               INT           NOT NULL,
    [bAppraised]                  BIT           NOT NULL,
    [lAppraisedRange]             INT           NOT NULL,
    [bIncomeClass]                BIT           NOT NULL,
    [bCapRate]                    BIT           NOT NULL,
    [lCapRateRange]               INT           NOT NULL,
    [bSubQuality]                 BIT           NULL,
    [bSecondaryUse]               BIT           NULL,
    [bTaxArea]                    BIT           NULL,
    [bCycle]                      BIT           NULL,
    [szCountyRatioCodes]          VARCHAR (255) NULL,
    [bMultiSaleExclude]           BIT           NULL,
    [bMultiSaleInclude]           BIT           NULL,
    [dtSaleDateMin]               DATETIME      NULL,
    [dtSaleDateMax]               DATETIME      NULL,
    [primary_zoning]              BIT           NULL,
    [secondary_zoning]            BIT           NULL,
    [import_view]                 BIT           NULL,
    [additional_sale_codes]       BIT           NULL,
    [actual_year_built]           BIT           NULL,
    [actual_year_built_deviation] INT           NULL,
    [improvement_value]           BIT           NULL,
    [improvement_value_deviation] INT           NULL,
    CONSTRAINT [CPK_comp_sales_corp_load_criteria] PRIMARY KEY CLUSTERED ([lPacsUserID] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_comp_sales_corp_load_criteria_delete_insert_update_MemTable
on comp_sales_corp_load_criteria
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
where szTableName = 'comp_sales_corp_load_criteria'

GO

