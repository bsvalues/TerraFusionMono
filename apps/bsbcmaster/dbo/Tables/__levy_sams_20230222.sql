CREATE TABLE [dbo].[__levy_sams_20230222] (
    [year]                          NUMERIC (4)      NOT NULL,
    [tax_district_id]               INT              NOT NULL,
    [levy_cd]                       VARCHAR (10)     NOT NULL,
    [end_year]                      NUMERIC (4)      NULL,
    [levy_type_cd]                  VARCHAR (10)     NULL,
    [voted]                         BIT              NULL,
    [levy_rate]                     NUMERIC (13, 10) NULL,
    [population_count_enable]       BIT              NULL,
    [population_count]              INT              NULL,
    [employee_cert_enable]          BIT              NULL,
    [employee_cert]                 DATETIME         NULL,
    [full_time_emp]                 BIT              NULL,
    [budget_received]               DATETIME         NULL,
    [budget_received_enable]        BIT              NULL,
    [budget_amount_enable]          BIT              NULL,
    [budget_amount]                 NUMERIC (14, 2)  NULL,
    [first_resolution_enable]       BIT              NULL,
    [first_resolution_date]         DATETIME         NULL,
    [second_resolution_enable]      BIT              NULL,
    [second_resolution_date]        DATETIME         NULL,
    [first_percent_enable]          BIT              NULL,
    [first_percent_amt]             NUMERIC (14, 10) NULL,
    [second_percent_enable]         BIT              NULL,
    [second_percent_amt]            NUMERIC (14, 10) NULL,
    [timber_assessed_enable]        BIT              NULL,
    [timber_assessed_cd]            VARCHAR (10)     NULL,
    [timber_assessed_full]          NUMERIC (14, 2)  NULL,
    [timber_assessed_half]          NUMERIC (14, 2)  NULL,
    [timber_assessed_roll]          NUMERIC (14, 2)  NULL,
    [election_date]                 DATETIME         NULL,
    [election_term]                 INT              NULL,
    [voted_levy_amt]                NUMERIC (14)     NULL,
    [voted_levy_rate]               NUMERIC (13, 10) NULL,
    [certification_date]            DATETIME         NULL,
    [levy_description]              VARCHAR (50)     NULL,
    [include_in_levy_certification] BIT              NOT NULL,
    [comment]                       VARCHAR (255)    NULL,
    [primary_fund_number]           NUMERIC (14)     NULL,
    [diversion_amount]              NUMERIC (14, 2)  NULL,
    [outstanding_debt]              NUMERIC (14, 2)  NOT NULL,
    [outstanding_debt_as_of_date]   DATETIME         NULL,
    [copy_elec_info_pacs_user_id]   INT              NULL,
    [copy_elec_info_date]           DATETIME         NULL,
    [factor]                        NUMERIC (13, 9)  NULL,
    [first_amount_requested]        NUMERIC (14, 2)  NULL,
    [second_amount_requested]       NUMERIC (14, 2)  NULL,
    [voted_levy_is_senior_exempt]   BIT              NULL,
    [senior_levy_rate]              NUMERIC (13, 10) NULL
);


GO

