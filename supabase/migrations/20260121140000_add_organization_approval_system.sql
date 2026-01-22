-- Add organization approval system to prevent spam/abuse
-- Organizations must be approved before they can post events

-- 1. Add organization_status column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS organization_status TEXT DEFAULT 'pending' 
CHECK (organization_status IN ('pending', 'approved', 'rejected'));

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_organization_status 
ON profiles(organization_status) 
WHERE organization_status IS NOT NULL;

-- 3. Update existing organizers to 'pending' (you can manually approve them later)
UPDATE profiles 
SET organization_status = 'pending' 
WHERE is_organizer = true AND organization_status IS NULL;

-- 4. Update RLS policy: Only approved organizations can create events
DROP POLICY IF EXISTS "Organizers can create events" ON organization_events;

CREATE POLICY "Approved organizers can create events"
  ON organization_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = organizer_id 
      AND profiles.user_id = auth.uid() 
      AND profiles.is_organizer = true
      AND profiles.organization_status = 'approved'  -- NEW: Must be approved!
    )
  );

-- 5. Add comment for documentation
COMMENT ON COLUMN profiles.organization_status IS 
'Organization approval status: pending (default), approved (can post events), rejected (cannot post events)';
