-- Create venue_followers table for venue follow system
CREATE TABLE IF NOT EXISTS public.venue_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id TEXT NOT NULL, -- venue_name (mekan adı) - OSM ID değil, mekan adı kullanılıyor
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, venue_id) -- Prevent duplicate follows
);

-- Enable RLS
ALTER TABLE public.venue_followers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Anyone can view venue followers" ON public.venue_followers;
DROP POLICY IF EXISTS "Users can follow venues" ON public.venue_followers;
DROP POLICY IF EXISTS "Users can unfollow venues" ON public.venue_followers;

-- Users can view all venue followers (public)
CREATE POLICY "Anyone can view venue followers"
  ON public.venue_followers
  FOR SELECT
  USING (true);

-- Users can follow venues
CREATE POLICY "Users can follow venues"
  ON public.venue_followers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unfollow venues
CREATE POLICY "Users can unfollow venues"
  ON public.venue_followers
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_venue_followers_user_id ON public.venue_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_followers_venue_id ON public.venue_followers(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_followers_created_at ON public.venue_followers(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE public.venue_followers IS 'Tracks which users follow which venues';
COMMENT ON COLUMN public.venue_followers.venue_id IS 'Venue name (venue_name) - matches venue_notes.venue_name and organization_events.location_name';
