-- Add venue details to drink_logs table
-- Bu migration venue_id hatasını kalıcı olarak çözecek

-- 1. Foursquare venue ID'si için kolon
ALTER TABLE public.drink_logs
ADD COLUMN IF NOT EXISTS venue_foursquare_id TEXT;

-- 2. Venue koordinatları (gelecekte mesafe hesaplama için)
ALTER TABLE public.drink_logs
ADD COLUMN IF NOT EXISTS venue_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS venue_longitude DECIMAL(11, 8);

-- 3. Venue adresi (detaylı bilgi için)
ALTER TABLE public.drink_logs
ADD COLUMN IF NOT EXISTS venue_address TEXT;

-- Indexler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_drink_logs_venue_foursquare_id 
  ON public.drink_logs(venue_foursquare_id);

CREATE INDEX IF NOT EXISTS idx_drink_logs_location 
  ON public.drink_logs(location) 
  WHERE location IS NOT NULL;

-- Yorumlar ekle
COMMENT ON COLUMN public.drink_logs.venue_foursquare_id IS 'Foursquare venue ID (fsq_id)';
COMMENT ON COLUMN public.drink_logs.venue_latitude IS 'Venue latitude coordinate';
COMMENT ON COLUMN public.drink_logs.venue_longitude IS 'Venue longitude coordinate';
COMMENT ON COLUMN public.drink_logs.venue_address IS 'Venue formatted address';
