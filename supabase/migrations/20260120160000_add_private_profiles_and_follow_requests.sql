-- Add is_private column to profiles table
ALTER TABLE public.profiles
ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT false;

-- Add status column to follows table
ALTER TABLE public.follows
ADD COLUMN status TEXT NOT NULL DEFAULT 'accepted'
CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Update existing follows to have 'accepted' status
UPDATE public.follows
SET status = 'accepted'
WHERE status IS NULL;

-- Drop existing follows policies
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;

-- Create new follows policies with status awareness
CREATE POLICY "Users can view accepted follows" 
  ON public.follows FOR SELECT 
  USING (status = 'accepted');

CREATE POLICY "Users can view their own follow requests" 
  ON public.follows FOR SELECT 
  USING (
    auth.uid() = follower_id OR 
    auth.uid() = following_id
  );

CREATE POLICY "Users can send follow requests" 
  ON public.follows FOR INSERT 
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can update follow requests they received" 
  ON public.follows FOR UPDATE 
  USING (auth.uid() = following_id)
  WITH CHECK (auth.uid() = following_id);

CREATE POLICY "Users can delete their own follows" 
  ON public.follows FOR DELETE 
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_follows_status ON public.follows(status);
CREATE INDEX IF NOT EXISTS idx_follows_following_status ON public.follows(following_id, status);
CREATE INDEX IF NOT EXISTS idx_follows_follower_status ON public.follows(follower_id, status);
