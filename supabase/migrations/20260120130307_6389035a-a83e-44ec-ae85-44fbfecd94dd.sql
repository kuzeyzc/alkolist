-- Create saved_drinks table for bookmarking posts
CREATE TABLE public.saved_drinks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_id UUID NOT NULL REFERENCES public.drink_logs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_id)
);

-- Enable RLS
ALTER TABLE public.saved_drinks ENABLE ROW LEVEL SECURITY;

-- RLS policies for saved_drinks
CREATE POLICY "Users can view their own saved drinks"
ON public.saved_drinks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save drinks"
ON public.saved_drinks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave drinks"
ON public.saved_drinks FOR DELETE
USING (auth.uid() = user_id);

-- Add recipe fields to drink_logs
ALTER TABLE public.drink_logs
ADD COLUMN IF NOT EXISTS recipe_ingredients TEXT,
ADD COLUMN IF NOT EXISTS recipe_instructions TEXT,
ADD COLUMN IF NOT EXISTS has_recipe BOOLEAN DEFAULT false;

-- Add promil_score column to drink_logs
ALTER TABLE public.drink_logs
ADD COLUMN IF NOT EXISTS promil_score INTEGER DEFAULT 0;