-- Add venue notification triggers
-- This migration adds triggers to notify venue followers when:
-- 1. A new event is created for a venue (by approved organizers)
-- 2. A new note is posted to a venue

-- First, extend notifications table to support venue notifications
-- Add metadata column to store additional info (venue_name, event_name, etc.)
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for metadata queries
CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON public.notifications USING gin (metadata);

-- Function to notify venue followers about new events
CREATE OR REPLACE FUNCTION public.notify_venue_followers_new_event()
RETURNS TRIGGER AS $$
DECLARE
  follower_record RECORD;
  organizer_profile RECORD;
BEGIN
  -- Only notify if organizer is approved
  SELECT * INTO organizer_profile
  FROM profiles
  WHERE id = NEW.organizer_id
  AND organization_status = 'approved';
  
  -- If organizer is not approved, skip notification
  IF organizer_profile IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Notify all followers of this venue
  FOR follower_record IN
    SELECT user_id FROM public.venue_followers
    WHERE venue_id = NEW.location_name
  LOOP
    INSERT INTO public.notifications (user_id, type, actor_id, metadata)
    VALUES (
      follower_record.user_id,
      'venue_new_event',
      NEW.organizer_id,
      jsonb_build_object(
        'venue_name', NEW.location_name,
        'event_name', NEW.event_name,
        'event_id', NEW.id
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new events
DROP TRIGGER IF EXISTS on_organization_event_created ON public.organization_events;
CREATE TRIGGER on_organization_event_created
  AFTER INSERT ON public.organization_events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_venue_followers_new_event();

-- Function to notify venue followers about new notes
CREATE OR REPLACE FUNCTION public.notify_venue_followers_new_note()
RETURNS TRIGGER AS $$
DECLARE
  follower_record RECORD;
BEGIN
  -- Notify all followers of this venue
  -- Note: venue_notes are anonymous, so we use a system actor_id
  -- We'll use a special UUID for system notifications
  FOR follower_record IN
    SELECT user_id FROM public.venue_followers
    WHERE venue_id = NEW.venue_name
  LOOP
    INSERT INTO public.notifications (user_id, type, actor_id, metadata)
    VALUES (
      follower_record.user_id,
      'venue_new_note',
      '00000000-0000-0000-0000-000000000000'::uuid, -- System actor for anonymous notes
      jsonb_build_object(
        'venue_name', NEW.venue_name,
        'note_id', NEW.id
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new notes
DROP TRIGGER IF EXISTS on_venue_note_created ON public.venue_notes;
CREATE TRIGGER on_venue_note_created
  AFTER INSERT ON public.venue_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_venue_followers_new_note();

-- Allow system to create notifications (for venue notifications)
-- System uses special UUID: 00000000-0000-0000-0000-000000000000
-- Note: SECURITY DEFINER functions bypass RLS, but we add this policy for clarity
DROP POLICY IF EXISTS "System can create venue notifications" ON public.notifications;

CREATE POLICY "System can create venue notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (
    actor_id = '00000000-0000-0000-0000-000000000000'::uuid
    OR type IN ('venue_new_event', 'venue_new_note')
  );

-- Add comments for documentation
COMMENT ON FUNCTION public.notify_venue_followers_new_event() IS 
'Notifies all followers when a new event is created for a venue (only for approved organizers)';
COMMENT ON FUNCTION public.notify_venue_followers_new_note() IS 
'Notifies all followers when a new note is posted to a venue';
