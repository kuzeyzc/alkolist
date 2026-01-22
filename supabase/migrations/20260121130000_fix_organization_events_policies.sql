-- Fix RLS policies for organization_events table
-- Problem: auth.uid() != profile.id
-- Solution: Check user_id in profiles table

-- Drop old policies
DROP POLICY IF EXISTS "Organizers can create events" ON organization_events;
DROP POLICY IF EXISTS "Organizers can update own events" ON organization_events;
DROP POLICY IF EXISTS "Organizers can delete own events" ON organization_events;

-- Create fixed policies

-- INSERT: Check if organizer_id belongs to current user and is_organizer = true
CREATE POLICY "Organizers can create events"
  ON organization_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = organizer_id 
      AND profiles.user_id = auth.uid() 
      AND profiles.is_organizer = true
    )
  );

-- UPDATE: Check if organizer_id belongs to current user
CREATE POLICY "Organizers can update own events"
  ON organization_events
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = organizer_id 
      AND profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = organizer_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- DELETE: Check if organizer_id belongs to current user
CREATE POLICY "Organizers can delete own events"
  ON organization_events
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = organizer_id 
      AND profiles.user_id = auth.uid()
    )
  );
