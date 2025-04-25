
create view ptd_sale_submission_first_buyer_vw
as

	select distinct chg_of_owner_id, min(buyer_id) as buyer_id
	from buyer_assoc with(nolock)
	group by chg_of_owner_id

GO

