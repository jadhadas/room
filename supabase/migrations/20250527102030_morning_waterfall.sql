/*
  # Create function to get tenants without mess payment for a month

  This function returns tenants who use mess but haven't paid mess charges for a specific month.
  It's used to track pending payments for the dashboard and mess tracking.
*/

CREATE OR REPLACE FUNCTION get_tenants_without_mess_payment(month_param DATE)
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  room_id UUID,
  join_date DATE,
  leave_date DATE,
  uses_mess BOOLEAN,
  deposit_amount INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
AS $$
  SELECT t.*
  FROM tenants t
  WHERE t.leave_date IS NULL
  AND t.uses_mess = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM mess_payments mp
    WHERE mp.tenant_id = t.id
    AND mp.month = month_param
  )
  ORDER BY t.name;
$$;