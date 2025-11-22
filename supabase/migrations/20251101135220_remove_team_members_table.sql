/*
  # Remove team_members table and related policies

  1. Changes
    - Drop all RLS policies for team_members table
    - Drop the team_members table
  
  2. Security
    - Clean removal of collaboration feature
    - Maintains wedding_team_roles table for personal helpers (Trauzeugen, Eltern, Helfer)
  
  3. Important Notes
    - This removes the team collaboration feature completely
    - Personal wedding helpers (wedding_team_roles) are NOT affected
    - This is a one-way operation - team_members data will be permanently deleted
*/

-- Drop all RLS policies for team_members
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
DROP POLICY IF EXISTS "Users can insert team members" ON team_members;
DROP POLICY IF EXISTS "Users can update team members" ON team_members;
DROP POLICY IF EXISTS "Users can delete team members" ON team_members;

-- Drop the team_members table
DROP TABLE IF EXISTS team_members;