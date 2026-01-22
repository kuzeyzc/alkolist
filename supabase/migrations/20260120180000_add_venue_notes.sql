-- Create venue_notes table (Masa Notları - Dijital Peçete)
CREATE TABLE public.venue_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_name TEXT NOT NULL, -- Mekan adı (anonim, user_id yok!)
  note TEXT NOT NULL CHECK (length(note) <= 100), -- Maksimum 100 karakter
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Pikselli detay için rastgele bir numara (1-5 arası)
  decoration_type INTEGER NOT NULL DEFAULT floor(random() * 5 + 1)
);

-- Enable RLS on venue_notes
ALTER TABLE public.venue_notes ENABLE ROW LEVEL SECURITY;

-- Anyone can view venue notes (public)
CREATE POLICY "Anyone can view venue notes" 
  ON public.venue_notes FOR SELECT 
  USING (true);

-- Anyone can insert venue notes (anonymous)
CREATE POLICY "Anyone can insert venue notes" 
  ON public.venue_notes FOR INSERT 
  WITH CHECK (true);

-- Auto-delete notes older than 24 hours (cleanup function)
CREATE OR REPLACE FUNCTION public.cleanup_old_venue_notes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.venue_notes
  WHERE created_at < (now() - interval '24 hours');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_venue_notes_venue_name ON public.venue_notes(venue_name);
CREATE INDEX IF NOT EXISTS idx_venue_notes_created_at ON public.venue_notes(created_at DESC);

-- Optional: Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-old-venue-notes', '0 * * * *', 'SELECT public.cleanup_old_venue_notes()');
