/*
  # Fix RLS Auth Performance - Batch 3 (Corrected)
  
  1. Optimization
    - Fix auth.uid() performance issues in RLS policies by using (SELECT auth.uid())
    - Tables covered: budget_items, budget_history, budget_payments, budget_partner_splits, wedding_day_packing_list
  
  2. Security
    - Maintains existing security model while improving performance
    - Each policy properly checks user ownership through wedding_id or block_id
*/

-- budget_items policies
DROP POLICY IF EXISTS "Users can view budget_items for their wedding" ON budget_items;
DROP POLICY IF EXISTS "Users can insert budget_items for their wedding" ON budget_items;
DROP POLICY IF EXISTS "Users can update budget_items for their wedding" ON budget_items;
DROP POLICY IF EXISTS "Users can delete budget_items for their wedding" ON budget_items;

CREATE POLICY "Users can view budget_items for their wedding"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert budget_items for their wedding"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update budget_items for their wedding"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete budget_items for their wedding"
  ON budget_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_items.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- budget_history policies
DROP POLICY IF EXISTS "Users can view budget_history for their wedding" ON budget_history;
DROP POLICY IF EXISTS "Users can insert budget_history for their wedding" ON budget_history;
DROP POLICY IF EXISTS "Users can delete budget_history for their wedding" ON budget_history;

CREATE POLICY "Users can view budget_history for their wedding"
  ON budget_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_history.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert budget_history for their wedding"
  ON budget_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_history.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete budget_history for their wedding"
  ON budget_history FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = budget_history.wedding_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- budget_payments policies
DROP POLICY IF EXISTS "Users can view budget_payments for their wedding" ON budget_payments;
DROP POLICY IF EXISTS "Users can insert budget_payments for their wedding" ON budget_payments;
DROP POLICY IF EXISTS "Users can update budget_payments for their wedding" ON budget_payments;
DROP POLICY IF EXISTS "Users can delete budget_payments for their wedding" ON budget_payments;

CREATE POLICY "Users can view budget_payments for their wedding"
  ON budget_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert budget_payments for their wedding"
  ON budget_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update budget_payments for their wedding"
  ON budget_payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete budget_payments for their wedding"
  ON budget_payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_payments.budget_item_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- budget_partner_splits policies
DROP POLICY IF EXISTS "Users can view budget_partner_splits for their wedding" ON budget_partner_splits;
DROP POLICY IF EXISTS "Users can insert budget_partner_splits for their wedding" ON budget_partner_splits;
DROP POLICY IF EXISTS "Users can update budget_partner_splits for their wedding" ON budget_partner_splits;
DROP POLICY IF EXISTS "Users can delete budget_partner_splits for their wedding" ON budget_partner_splits;

CREATE POLICY "Users can view budget_partner_splits for their wedding"
  ON budget_partner_splits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_partner_splits.budget_item_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert budget_partner_splits for their wedding"
  ON budget_partner_splits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_partner_splits.budget_item_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update budget_partner_splits for their wedding"
  ON budget_partner_splits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_partner_splits.budget_item_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_partner_splits.budget_item_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete budget_partner_splits for their wedding"
  ON budget_partner_splits FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM budget_items
      JOIN weddings ON weddings.id = budget_items.wedding_id
      WHERE budget_items.id = budget_partner_splits.budget_item_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

-- wedding_day_packing_list policies (references block_id not wedding_id)
DROP POLICY IF EXISTS "Users can view wedding_day_packing_list for their wedding" ON wedding_day_packing_list;
DROP POLICY IF EXISTS "Users can insert wedding_day_packing_list for their wedding" ON wedding_day_packing_list;
DROP POLICY IF EXISTS "Users can update wedding_day_packing_list for their wedding" ON wedding_day_packing_list;
DROP POLICY IF EXISTS "Users can delete wedding_day_packing_list for their wedding" ON wedding_day_packing_list;

CREATE POLICY "Users can view wedding_day_packing_list for their wedding"
  ON wedding_day_packing_list FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_packing_list.block_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert wedding_day_packing_list for their wedding"
  ON wedding_day_packing_list FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_packing_list.block_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update wedding_day_packing_list for their wedding"
  ON wedding_day_packing_list FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_packing_list.block_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_packing_list.block_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete wedding_day_packing_list for their wedding"
  ON wedding_day_packing_list FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wedding_day_blocks
      JOIN weddings ON weddings.id = wedding_day_blocks.wedding_id
      WHERE wedding_day_blocks.id = wedding_day_packing_list.block_id
      AND weddings.user_id = (SELECT auth.uid())
    )
  );
