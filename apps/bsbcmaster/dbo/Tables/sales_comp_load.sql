CREATE TABLE [dbo].[sales_comp_load] (
    [criteria_id]                 INT           NOT NULL,
    [criteria_id_type]            VARCHAR (5)   NOT NULL,
    [comparison_type]             CHAR (1)      NOT NULL,
    [school_entity]               BIT           NULL,
    [city_entity]                 BIT           NULL,
    [state_cd]                    BIT           NULL,
    [region_cd]                   BIT           NULL,
    [abs_subdv_cd]                BIT           NULL,
    [hood_cd]                     BIT           NULL,
    [subset_cd]                   BIT           NULL,
    [map_id]                      BIT           NULL,
    [class_cd]                    BIT           NULL,
    [land_type]                   BIT           NULL,
    [condition_cd]                BIT           NULL,
    [imprv_type_cd]               BIT           NULL,
    [primary_use]                 BIT           NULL,
    [secondary_use]               BIT           NULL,
    [primary_zoning]              BIT           NULL,
    [secondary_zoning]            BIT           NULL,
    [import_view]                 BIT           NULL,
    [tax_area_code]               BIT           NULL,
    [cycle]                       BIT           NULL,
    [sale_price]                  BIT           NULL,
    [sale_price_dev]              INT           NULL,
    [appr_val]                    BIT           NULL,
    [appr_val_dev]                INT           NULL,
    [living_area]                 BIT           NULL,
    [living_area_dev]             INT           NULL,
    [year_built]                  BIT           NULL,
    [year_built_dev]              INT           NULL,
    [imprv_up]                    BIT           NULL,
    [imprv_up_dev]                INT           NULL,
    [imprv_add_val]               BIT           NULL,
    [imprv_add_val_dev]           INT           NULL,
    [land_size_acres]             BIT           NULL,
    [land_size_acres_dev]         INT           NULL,
    [land_size_sqft]              BIT           NULL,
    [land_size_sqft_dev]          INT           NULL,
    [land_size_ff]                BIT           NULL,
    [land_size_ff_dev]            INT           NULL,
    [land_size_lot]               BIT           NULL,
    [land_up]                     BIT           NULL,
    [land_up_dev]                 INT           NULL,
    [actual_year_built]           BIT           NULL,
    [actual_year_built_deviation] INT           NULL,
    [improvement_value]           BIT           NULL,
    [improvement_value_deviation] INT           NULL,
    [subclass_cd]                 BIT           NULL,
    [subclass_dev]                INT           NULL,
    [hood_like]                   BIT           NULL,
    [hood_like_num_char]          INT           NULL,
    [sale_date]                   BIT           NULL,
    [sale_date_range_min]         DATETIME      NULL,
    [sale_date_range_max]         DATETIME      NULL,
    [sale_type_codes]             VARCHAR (255) NULL,
    [sale_ratio_codes]            VARCHAR (255) NULL,
    [county_ratio_codes]          VARCHAR (255) NULL,
    [additional_sale_codes]       VARCHAR (255) NULL,
    [multi_sale_include]          BIT           NULL,
    [multi_sale_exclude]          BIT           NULL,
    [imprv_det_type_codes]        VARCHAR (255) NULL,
    [mapsco]                      BIT           NULL,
    [land_size_lot_dev]           INT           NULL,
    CONSTRAINT [CPK_sales_comp_load] PRIMARY KEY CLUSTERED ([criteria_id] ASC, [criteria_id_type] ASC, [comparison_type] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_sales_comp_load_delete_insert_update_MemTable
on sales_comp_load
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
where szTableName = 'sales_comp_load'

GO

