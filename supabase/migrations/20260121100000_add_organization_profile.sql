-- Add organization profile columns to profiles table
ALTER TABLE profiles 
ADD COLUMN is_organizer BOOLEAN DEFAULT false,
ADD COLUMN organization_name TEXT,
ADD COLUMN organization_type TEXT,
ADD COLUMN organization_logo TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_organizer IS 'Whether the user has created an organization profile';
COMMENT ON COLUMN profiles.organization_name IS 'Organization name (max 20 chars + " Organizasyon")';
COMMENT ON COLUMN profiles.organization_type IS 'Type of organization (Techno, Stand-up, Jazz, etc.)';
COMMENT ON COLUMN profiles.organization_logo IS 'URL to organization logo image';
