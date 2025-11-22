/*
  # Add Premium RLS Policies for Vendor Payments

  1. Security Changes
    - Add RESTRICTIVE policies to vendor_payments table
    - Prevent Free users from creating payment plans (milestone/monthly types)
    - Only allow Premium users to create structured payment plans
    - Free users can only create basic deposit/final payments
    - Maintain read access for all authenticated users who own the vendor

  2. Important Notes
    - Uses RESTRICTIVE policies to ensure enforcement even if permissive policies exist
    - Checks subscription_tier from user_profiles table
    - Prevents API bypass attempts by Free users
    - Allows deposit and final payment types for Free users (basic functionality)
*/

-- Drop existing restrictive policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "vendor_payments_insert_check_premium_type" ON vendor_payments;
DROP POLICY IF EXISTS "vendor_payments_update_check_premium_type" ON vendor_payments;

-- Restrictive policy: Only Premium users can INSERT milestone/monthly payment types
CREATE POLICY "vendor_payments_insert_check_premium_type"
ON vendor_payments AS RESTRICTIVE FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow deposit and final payments for all users
  (payment_type IN ('deposit', 'final') OR payment_type IS NULL)
  OR
  -- Only Premium users can create milestone and monthly payments
  (
    payment_type IN ('milestone', 'monthly') AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND subscription_tier = 'premium'
    )
  )
);

-- Restrictive policy: Only Premium users can UPDATE to milestone/monthly payment types
CREATE POLICY "vendor_payments_update_check_premium_type"
ON vendor_payments AS RESTRICTIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM vendors v
    JOIN weddings w ON v.wedding_id = w.id
    WHERE v.id = vendor_payments.vendor_id
    AND w.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Allow deposit and final payments for all users
  (payment_type IN ('deposit', 'final') OR payment_type IS NULL)
  OR
  -- Only Premium users can update to milestone and monthly payments
  (
    payment_type IN ('milestone', 'monthly') AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND subscription_tier = 'premium'
    )
  )
);
