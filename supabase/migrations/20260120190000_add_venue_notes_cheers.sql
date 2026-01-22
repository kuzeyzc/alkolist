-- Add cheers_count to venue_notes table
ALTER TABLE public.venue_notes
ADD COLUMN IF NOT EXISTS cheers_count INTEGER NOT NULL DEFAULT 0;

-- Create venue_note_cheers table to track who cheered which note
CREATE TABLE public.venue_note_cheers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.venue_notes(id) ON DELETE CASCADE,
  user_id UUID, -- NULL for anonymous users (using fingerprint instead)
  user_fingerprint TEXT, -- For anonymous tracking (browser fingerprint)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Ensure one cheer per user/fingerprint per note
  UNIQUE (note_id, user_id),
  UNIQUE (note_id, user_fingerprint)
);

-- Enable RLS on venue_note_cheers
ALTER TABLE public.venue_note_cheers ENABLE ROW LEVEL SECURITY;

-- Anyone can view cheers
CREATE POLICY "Anyone can view venue note cheers" 
  ON public.venue_note_cheers FOR SELECT 
  USING (true);

-- Anyone can insert cheers
CREATE POLICY "Anyone can insert venue note cheers" 
  ON public.venue_note_cheers FOR INSERT 
  WITH CHECK (true);

-- Users can delete their own cheers
CREATE POLICY "Users can delete their own cheers" 
  ON public.venue_note_cheers FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (auth.uid() IS NULL AND user_fingerprint IS NOT NULL)
  );

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_venue_note_cheers_note_id ON public.venue_note_cheers(note_id);
CREATE INDEX IF NOT EXISTS idx_venue_note_cheers_user_id ON public.venue_note_cheers(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_note_cheers_fingerprint ON public.venue_note_cheers(user_fingerprint);

-- Function to increment cheers_count
CREATE OR REPLACE FUNCTION public.increment_note_cheers(note_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.venue_notes
  SET cheers_count = cheers_count + 1
  WHERE id = note_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement cheers_count
CREATE OR REPLACE FUNCTION public.decrement_note_cheers(note_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.venue_notes
  SET cheers_count = GREATEST(cheers_count - 1, 0)
  WHERE id = note_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-increment cheers_count when a cheer is added
CREATE OR REPLACE FUNCTION public.handle_note_cheer_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.increment_note_cheers(NEW.note_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_note_cheer_insert
  AFTER INSERT ON public.venue_note_cheers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_note_cheer_insert();

-- Trigger to auto-decrement cheers_count when a cheer is removed
CREATE OR REPLACE FUNCTION public.handle_note_cheer_delete()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.decrement_note_cheers(OLD.note_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_note_cheer_delete
  AFTER DELETE ON public.venue_note_cheers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_note_cheer_delete();
