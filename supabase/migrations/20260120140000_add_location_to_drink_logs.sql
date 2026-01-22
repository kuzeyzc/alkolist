-- Add location column to drink_logs table
ALTER TABLE public.drink_logs
ADD COLUMN location TEXT;

-- Add comment to the column
COMMENT ON COLUMN public.drink_logs.location IS 'Location name or address where the drink was consumed';
