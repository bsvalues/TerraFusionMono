


 
CREATE procedure [dbo].Monitor_BIDTAXDUE
 

@sa_agency_id int  ---521 is BID
 
as
 
SET NOCOUNT ON

select b.prop_id, b.display_year, b.statement_id,sum (b.current_amount_due - b.amount_paid) as bal_due
from bill b with(nolock)
join assessment_bill ab with (nolock)
on b.bill_id = ab.bill_id 
join special_assessment_agency saa with (nolock)
on ab.agency_id = saa.agency_id
and saa.agency_id = @sa_agency_id
join property p with(nolock)
on p.prop_id = b.prop_id
where b.year =  (select tax_yr from pacs_system)
group by b.prop_id,  b.display_year, b.statement_id
having sum (b.current_amount_due - b.amount_paid) > 0.00

GO

