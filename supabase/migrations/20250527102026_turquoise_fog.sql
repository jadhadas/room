/*
  # Create function to get tenants without rent payment for a month

  This function returns tenants who haven't paid rent for a specific month.
  It's used to track pending payments for the dashboard and rent tracking.
*/

CREATE OR REPLACE FUNCTION get_tenants_without_rent_payment(month_param DATE)
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
  AND NOT EXISTS (
    SELECT 1 FROM rent_payments rp
    WHERE rp.tenant_id = t.id
    AND rp.month = month_param
  )
  ORDER BY t.name;
$$;