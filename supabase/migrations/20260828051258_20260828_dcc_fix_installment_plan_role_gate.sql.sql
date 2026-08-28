/*
# DCC — Fix Installment Plan Creation Role Gate

## Problem
The `dcc_create_installment_plan` function rejects any caller whose role is not
'admin' or 'manager'. The rest of the DCC module (tables, RLS policies, and the
sibling functions `dcc_record_payment` and `dcc_pay_installment_row`) all allow
`anon, authenticated` access — the DCC module is a single-tenant demo with no
sign-in gate. When the app runs in demo mode (no real Supabase session),
`auth.uid()` returns NULL, `extensions.get_user_role()` returns 'public', and the
function raises: "Only Estate Managers and Administrators can create installment
plans". This blocks installment creation entirely.

## Fix
Remove the server-side role check from `dcc_create_installment_plan` so it
matches the access pattern of the other DCC functions. The frontend already
controls visibility of the Create Plan button via `canManagePlan` (role ===
'manager' || 'admin'), which is sufficient for the demo app.

## Security
- No change to RLS policies on dcc_installment_plans or dcc_installment_rows.
- The function remains SECURITY DEFINER (required to insert into the plan/row
  tables atomically) but no longer gates on a role that is unavailable in the
  demo/no-auth context.
- EXECUTE remains granted to both anon and authenticated.
*/

CREATE OR REPLACE FUNCTION public.dcc_create_installment_plan(
  p_demand_id uuid,
  p_config jsonb,
  p_rows jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_existing_plan_id uuid;
  v_plan_id uuid;
  v_plan json;
  v_inserted_rows json;
  v_row record;
BEGIN
  -- Validate demand exists
  PERFORM 1 FROM dcc_demands WHERE id = p_demand_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demand not found: %', p_demand_id;
  END IF;

  -- Delete existing plan for this demand (replace flow)
  DELETE FROM dcc_installment_plans WHERE demand_id = p_demand_id
    RETURNING id INTO v_existing_plan_id;

  -- Insert the new plan
  INSERT INTO dcc_installment_plans (
    demand_id,
    no_of_installments,
    installment_start_date,
    late_fee,
    due_days_with_late_fee,
    interest_pct_pa,
    discount_full_payment_pct,
    gst_pct,
    gst_type,
    balance_payment
  ) VALUES (
    p_demand_id,
    (p_config->>'no_of_installments')::integer,
    NULLIF(p_config->>'installment_start_date', '')::date,
    COALESCE((p_config->>'late_fee')::numeric, 0),
    COALESCE((p_config->>'due_days_with_late_fee')::integer, 0),
    COALESCE((p_config->>'interest_pct_pa')::numeric, 0),
    COALESCE((p_config->>'discount_full_payment_pct')::numeric, 0),
    COALESCE((p_config->>'gst_pct')::numeric, 0),
    COALESCE(p_config->>'gst_type', 'inclusive'),
    COALESCE((p_config->>'balance_payment')::numeric, 0)
  )
  RETURNING id, to_json(dcc_installment_plans.*) INTO v_plan_id, v_plan;

  -- Insert all installment rows
  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows) AS row_data
  LOOP
    INSERT INTO dcc_installment_rows (
      plan_id,
      row_number,
      label,
      percentage,
      amount,
      due_date,
      late_fee,
      due_date_with_late_fee,
      gst_amount
    ) VALUES (
      v_plan_id,
      (v_row.row_data->>'row_number')::integer,
      v_row.row_data->>'label',
      (v_row.row_data->>'percentage')::numeric,
      (v_row.row_data->>'amount')::numeric,
      NULLIF(v_row.row_data->>'due_date', '')::date,
      COALESCE((v_row.row_data->>'late_fee')::numeric, 0),
      NULLIF(v_row.row_data->>'due_date_with_late_fee', '')::date,
      COALESCE((v_row.row_data->>'gst_amount')::numeric, 0)
    );
  END LOOP;

  -- Return the created plan and rows
  SELECT COALESCE(json_agg(r), '[]'::json) INTO v_inserted_rows
  FROM (
    SELECT * FROM dcc_installment_rows WHERE plan_id = v_plan_id ORDER BY row_number
  ) r;

  RETURN json_build_object('plan', v_plan, 'rows', v_inserted_rows);
END;
$function$;

-- Re-grant execute to both anon and authenticated (matching the rest of the DCC module)
GRANT EXECUTE ON FUNCTION public.dcc_create_installment_plan(uuid, jsonb, jsonb) TO anon, authenticated;
