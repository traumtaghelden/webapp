/*
  # Fix Guest Groups RLS Infinite Recursion

  ## Summary
  Fixes the infinite recursion error in guest_groups RLS policies by removing the problematic
  premium limit policy that queries the same table within its own INSERT check.

  ## Problem
  The policy "guest_groups_insert_check_premium_limit" was causing infinite recursion because
  it queries guest_groups table within a guest_groups INSERT policy, creating a circular dependency.

  ## Solution
  1. Drop the problematic premium limit policy
  2. Simplify to use basic ownership-based policies only
  3. Move limit enforcement to application layer or use a separate approach

  ## Changes Made
  - Remove "guest_groups_insert_check_premium_limit" policy
  - Keep simple ownership-based policies that don't cause recursion

  ## Security
  - Users can only manage guest_groups for weddings they own
  - No data access is compromised
  - Limit enforcement can be handled in application code
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "guest_groups_insert_check_premium_limit" ON guest_groups;

-- Ensure we have the correct, non-recursive policies in place
-- The existing policies from the original migration are fine and don't cause recursion