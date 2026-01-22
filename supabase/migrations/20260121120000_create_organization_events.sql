-- Create organization_events table for event posters
CREATE TABLE IF NOT EXISTS organization_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  description TEXT,
  location_id TEXT,
  location_name TEXT NOT NULL,
  ticket_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_organization_events_organizer ON organization_events(organizer_id);
CREATE INDEX idx_organization_events_location ON organization_events(location_id);
CREATE INDEX idx_organization_events_date ON organization_events(date);

-- Enable RLS
ALTER TABLE organization_events ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can view events
CREATE POLICY "Anyone can view events"
  ON organization_events
  FOR SELECT
  USING (true);

-- Policies: Only organizers can create their own events
CREATE POLICY "Organizers can create events"
  ON organization_events
  FOR INSERT
  WITH CHECK (
    auth.uid() = organizer_id AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_organizer = true
    )
  );

-- Policies: Only organizers can update their own events
CREATE POLICY "Organizers can update own events"
  ON organization_events
  FOR UPDATE
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

-- Policies: Only organizers can delete their own events
CREATE POLICY "Organizers can delete own events"
  ON organization_events
  FOR DELETE
  USING (auth.uid() = organizer_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_organization_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_organization_events_timestamp
  BEFORE UPDATE ON organization_events
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_events_updated_at();
