-- Fix venue_id column issue in venue_notes table
-- The table should only use venue_name, not venue_id
-- If venue_id column exists from manual changes, drop it

DO $$ 
BEGIN
    -- Check if venue_id column exists and drop it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'venue_notes' 
        AND column_name = 'venue_id'
    ) THEN
        ALTER TABLE public.venue_notes DROP COLUMN venue_id;
    END IF;
END $$;

-- Ensure venue_name is indexed and required
ALTER TABLE public.venue_notes 
ALTER COLUMN venue_name SET NOT NULL;
