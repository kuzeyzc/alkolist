-- Fix the UPDATE policy for follows table
-- The previous version was missing WITH CHECK clause

-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update follow requests they received" ON public.follows;

-- Recreate with both USING and WITH CHECK
CREATE POLICY "Users can update follow requests they received" 
  ON public.follows FOR UPDATE 
  USING (auth.uid() = following_id)
  WITH CHECK (auth.uid() = following_id);
