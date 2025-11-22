/*
  # Fix Task Completion Trigger

  1. Changes
    - Update sync_task_completion_to_payment function to use status field instead of completed
    - Update sync_payment_to_task function to use status field
    - Tasks use status ('pending', 'in_progress', 'completed'), not a boolean completed field
  
  2. Notes
    - This fixes the "record new has no field completed" error
    - Trigger now checks if status changed to 'completed'
*/

-- Drop and recreate the trigger function with correct field reference
CREATE OR REPLACE FUNCTION sync_task_completion_to_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_budget_item_id uuid;
  v_payment_id uuid;
  v_task_title text;
BEGIN
  -- Only process if task status changed to completed and has budget/vendor link
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    v_task_title := NEW.title;
    
    -- Check if task is linked to a budget item via vendor
    IF NEW.vendor_id IS NOT NULL THEN
      SELECT id INTO v_budget_item_id
      FROM budget_items
      WHERE vendor_id = NEW.vendor_id
      LIMIT 1;
      
      IF v_budget_item_id IS NOT NULL THEN
        -- Mark related payments as paid
        UPDATE budget_payments
        SET status = 'paid', payment_date = now()
        WHERE budget_item_id = v_budget_item_id
        AND status = 'pending'
        AND amount <= (SELECT actual_cost FROM budget_items WHERE id = v_budget_item_id)
        RETURNING id INTO v_payment_id;
        
        IF v_payment_id IS NOT NULL THEN
          -- Log the activity
          PERFORM log_activity(
            NEW.wedding_id,
            'task',
            NEW.id,
            'completed',
            'payment',
            v_payment_id,
            v_task_title,
            jsonb_build_object('auto_payment_update', true)
          );
        END IF;
      END IF;
    END IF;
    
    -- Check if task is directly linked to a budget item
    IF NEW.budget_item_id IS NOT NULL THEN
      UPDATE budget_payments
      SET status = 'paid', payment_date = now()
      WHERE budget_item_id = NEW.budget_item_id
      AND status = 'pending'
      RETURNING id INTO v_payment_id;
      
      IF v_payment_id IS NOT NULL THEN
        PERFORM log_activity(
          NEW.wedding_id,
          'task',
          NEW.id,
          'completed',
          'payment',
          v_payment_id,
          v_task_title,
          jsonb_build_object('auto_payment_update', true)
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update sync_payment_to_task function
CREATE OR REPLACE FUNCTION sync_payment_to_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task_id uuid;
  v_task_title text;
  v_budget_item budget_items%ROWTYPE;
BEGIN
  -- Only process when payment status changes to 'paid'
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    -- Get budget item details
    SELECT * INTO v_budget_item
    FROM budget_items
    WHERE id = NEW.budget_item_id;
    
    IF v_budget_item.id IS NOT NULL THEN
      -- Find task linked to this budget item
      SELECT id, title INTO v_task_id, v_task_title
      FROM tasks
      WHERE budget_item_id = NEW.budget_item_id
      AND status != 'completed'
      LIMIT 1;
      
      IF v_task_id IS NOT NULL THEN
        -- Mark task as completed
        UPDATE tasks
        SET status = 'completed'
        WHERE id = v_task_id;
        
        -- Log the activity
        PERFORM log_activity(
          (SELECT wedding_id FROM tasks WHERE id = v_task_id),
          'payment',
          NEW.id,
          'payment_made',
          'task',
          v_task_id,
          NULL,
          jsonb_build_object('auto_task_completion', true, 'task_title', v_task_title)
        );
      END IF;
      
      -- Also check for tasks linked via vendor
      IF v_budget_item.vendor_id IS NOT NULL THEN
        SELECT id, title INTO v_task_id, v_task_title
        FROM tasks
        WHERE vendor_id = v_budget_item.vendor_id
        AND status != 'completed'
        LIMIT 1;
        
        IF v_task_id IS NOT NULL THEN
          UPDATE tasks
          SET status = 'completed'
          WHERE id = v_task_id;
          
          PERFORM log_activity(
            (SELECT wedding_id FROM tasks WHERE id = v_task_id),
            'payment',
            NEW.id,
            'payment_made',
            'task',
            v_task_id,
            NULL,
            jsonb_build_object('auto_task_completion', true, 'task_title', v_task_title, 'via_vendor', true)
          );
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;