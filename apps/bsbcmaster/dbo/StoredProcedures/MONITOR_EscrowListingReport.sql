CREATE procedure MONITOR_EscrowListingReport

@begin_date		datetime,
@end_date		datetime

as 

SELECT 
				--dataset_id, 
				date_paid,
				prop_id,
                escrow_id, 
				legal_desc,	
				receipt_num, 
				escrow_type_cd, 
				escrow_type_desc,
				escrow_collected, 
				tax_amount, 
				over_under_variance, 
				comment, 
				amount_overpaid

				FROM ( 
				    SELECT 
    				--{0} as dataset_id,
			        case 
						when pay.all_paid_amount > 0 then pay.date_paid 
						when pay.all_applied_amount > 0 then pay.date_paid 
					  end as date_paid,
			        pay.prop_id,
			        pay.escrow_id,
			        pv.legal_desc,
			        pay.receipt_num,
			        ewt.escrow_type_cd,
			        ewt.escrow_type_desc,
			       -- isnull(pay.all_paid_amount, 0) - isnull(pay.all_voided_pay, 0) as escrow_collected, 

						isnull(pay.all_paid_amount, 0) as escrow_collected, 
						
						(case when pay.all_applied_amount <= 0 then 0
				        else isnull(pay.all_applied_amount, 0) - isnull(pay.all_voided_apply, 0) end) 			       
				        as tax_amount,
		    				   	
			        (case when pay.is_op_up = 1  
				        then isnull(ew.amount_paid, 0) - isnull(ew.amount_due, 0) 
				        else 0 end) as over_under_variance,

			        ew.comment,
	
			        (case when pay.is_op_refund = 1
				        then isnull(ew.amount_paid,0) - isnull(ew.amount_due, 0) 
				        else 0 end) as amount_overpaid

				    FROM ( 
			            select distinct
			            esc.prop_id,
			            esc.escrow_id,

			           -- (select isnull(sum(esc.amount), 0)
			          --  from escrow es with(nolock)
			          --  where es.escrow_id = esc.escrow_id
			          --  and (esc.action = 'Pay')) as all_paid_amount,

									(select isnull(sum(esc.amount), 0)
			            from escrow es with(nolock)
			            where es.escrow_id = esc.escrow_id
			            and (esc.action = 'Pay')) as all_paid_amount,
			            
			            (select isnull(sum(esc.amount), 0)
			            from escrow es with(nolock)
			            where es.escrow_id = esc.escrow_id
			            and (esc.action = 'Void Payment')) as all_voided_pay,

			            (select isnull(sum(esc.amount), 0)
			            from escrow es with(nolock)
			            where es.escrow_id = esc.escrow_id
			            and (esc.action = 'Apply')) as all_applied_amount,

			            (select isnull(sum(esc.amount), 0)
			            from escrow es with(nolock)
			            where es.escrow_id = esc.escrow_id
			            and (esc.action = 'Void Application')) as all_voided_apply,

			            convert(bit, case when exists (
				            select 1 from escrow es with(nolock)
			            where es.escrow_id = esc.escrow_id and es.prop_id = esc.prop_id and esc.payment_code = 'OPR')
			            then 1 else 0 end) is_op_refund,

			            convert(bit, case when exists (
				            select 1 from escrow es with(nolock)
			            where es.escrow_id = esc.escrow_id and es.prop_id = esc.prop_id and esc.payment_code in ('OP','UP'))
			            then 1 else 0 end) is_op_up,

			            esc.date_paid,
			            esc.receipt_num,
			            esc.remaining_credit,
			            esc.remaining_due

			            from 
			            (
				            select 
					        e.prop_id,
					        e.escrow_id,
					        pmt.payment_id, 
					        case
						        when pmt.transaction_type = 'PE' then 'Pay'
						        when pmt.transaction_type = 'AE' then 'Apply'
						        when pmt.transaction_type = 'VOID' then
							        case when pmt.amount <= 0 then 'Void Payment' else 'Void Application' end
					        end as action, 
					        abs(pmt.amount) as amount, 
									p.amount_paid as amount_paid,

					        e.amount_due - h1.paid_so_far as remaining_due, 
					        h1.paid_so_far - h2.applied_so_far as remaining_credit, 
					        p.date_paid, p.post_date, p.payee_name, p.payment_code,
					        pu.pacs_user_name as operator_name,
					        ps.payment_source_cd as source_name,
					        p.receipt_num

				        FROM escrow e with (nolock)

				        cross apply (
					        select pta.payment_id, ct.transaction_type, ct.trans_group_id as escrow_id,
						        max(ct.transaction_id) as last_transaction_id, sum(ct.base_amount_pd) as amount

					        from coll_transaction ct with(nolock)

					        join payment_transaction_assoc pta with(nolock)
					        on pta.transaction_id = ct.transaction_id
									and pta.void_transaction_id is NULL	

					        where ct.trans_group_id = e.escrow_id

					        group by pta.payment_id, ct.transaction_type, ct.trans_group_id
				        ) pmt

				        outer apply (
					        select isnull(sum(cth.base_amount_pd), 0) paid_so_far
					        from coll_transaction cth with(nolock)
					        where cth.trans_group_id = pmt.escrow_id
					        and cth.transaction_id <= pmt.last_transaction_id
					        and (cth.transaction_type = 'PE' or (cth.transaction_type = 'VOID' and cth.base_amount_pd < 0)) 
				        ) h1

				        outer apply (
					        select -isnull(sum(cth.base_amount_pd), 0) applied_so_far
					        from coll_transaction cth with(nolock)
					        where cth.trans_group_id = pmt.escrow_id
					        and cth.transaction_id <= pmt.last_transaction_id
					        and (cth.transaction_type = 'AE' or (cth.transaction_type = 'VOID' and cth.base_amount_pd > 0)) 	
				        ) h2

				        join payment p with(nolock)
				        on p.payment_id = pmt.payment_id

				        left join pacs_user pu with(nolock) 
				        on p.pacs_user_id = pu.pacs_user_id 

				        left join payment_source ps with(nolock) 
				        on p.payment_source_id = ps.payment_source_id

			    ) esc
			    group by prop_id, escrow_id, date_paid, receipt_num, action, payment_code, esc.remaining_credit, esc.remaining_due

		    ) pay

		    JOIN escrow ew with (nolock) on pay.escrow_id = ew.escrow_id and pay.prop_id = ew.prop_id

		    JOIN escrow_type ewt with (nolock)
		    ON ewt.escrow_type_cd = ew.escrow_type_cd and ewt.year = ew.year

		    JOIN property p with (nolock)
		    ON p.prop_id = ew.prop_id

		    LEFT JOIN prop_supp_assoc psa with (nolock)
		    ON psa.prop_id = p.prop_id AND psa.owner_tax_yr = ew.year

		    LEFT JOIN property_val pv with (nolock)
		    ON pv.prop_id = psa.prop_id AND pv.sup_num = psa.sup_num
		    AND pv.prop_val_yr = psa.owner_tax_yr

	        where ( all_paid_amount > 0 or all_applied_amount > 0 )
	        ) t
	        where (1 = 1)
			 AND t.date_paid >= @begin_date
			 AND t.date_paid <= @end_date
			 order by prop_id, escrow_id, receipt_num

GO

