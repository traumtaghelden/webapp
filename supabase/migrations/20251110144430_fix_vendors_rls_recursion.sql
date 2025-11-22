/*
  # Fix Vendors RLS Recursion Issue

  1. Problem
    - The INSERT policy for vendors has infinite recursion
    - The policy references vendors.wedding_id which causes a recursive check

  2. Solution
    - Drop the existing INSERT policy
    - Create a new INSERT policy that avoids recursion by using NEW.wedding_id
    - Use a SECURITY DEFINER function to check vendor count safely

  3. Changes
    - Drop problematic INSERT policy
    - Create helper function to count vendors
    - Create new INSERT policy without recursion
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can insert vendors for their weddings" ON vendors;

-- Create a helper function to count existing vendors for a wedding (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION count_vendors_for_wedding(p_wedding_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vendor_count integer;
BEGIN
  SELECT COUNT(*) INTO vendor_count
  FROM vendors
  WHERE wedding_id = p_wedding_id;
  
  RETURN vendor_count;
END;
$$;

-- Create new INSERT policy without recursion
CREATE POLICY "Users can insert vendors for their weddings"
  ON vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must own the wedding
    EXISTS (
      SELECT 1 FROM weddings w
      WHERE w.id = wedding_id
      AND w.user_id = auth.uid()
    )
    AND (
      -- Either premium user OR under the free limit
      EXISTS (
        SELECT 1 FROM weddings w
        WHERE w.id = wedding_id
        AND w.is_premium = true
      )
      OR count_vendors_for_wedding(wedding_id) < 5
    )
  );
