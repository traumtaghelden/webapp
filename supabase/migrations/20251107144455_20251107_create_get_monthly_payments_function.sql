/*
  # Create get_monthly_payments Function
  
  1. New Functions
    - `get_monthly_payments` - Returns all payments due in a specific month
      - Parameters:
        - `p_wedding_id` (uuid) - The wedding ID
        - `p_year` (integer) - The year
        - `p_month` (integer) - The month (1-12)
      - Returns: Table of payment information
  
  2. Security
    - Function runs with invoker's permissions (security definer not needed)
    - RLS policies on underlying tables will apply
*/

-- Create function to get monthly payments
CREATE OR REPLACE FUNCTION get_monthly_payments(
  p_wedding_id uuid,
  p_year integer,
  p_month integer
)
RETURNS TABLE (
  id uuid,
  budget_item_id uuid,
  item_name text,
  amount numeric,
  due_date date,
  payment_date date,
  status text,
  notes text,
  payment_method text,
  category text
) 
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bp.id,
    bp.budget_item_id,
    bi.item_name,
    bp.amount,
    bp.due_date,
    bp.payment_date,
    bp.status,
    bp.notes,
    bp.payment_method,
    bi.category
  FROM budget_payments bp
  JOIN budget_items bi ON bp.budget_item_id = bi.id
  WHERE bi.wedding_id = p_wedding_id
    AND EXTRACT(YEAR FROM bp.due_date) = p_year
    AND EXTRACT(MONTH FROM bp.due_date) = p_month
  ORDER BY bp.due_date ASC, bp.status DESC;
END;
$$;