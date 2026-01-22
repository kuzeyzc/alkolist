-- Add location fields to organization profiles
ALTER TABLE profiles 
ADD COLUMN organization_location_id TEXT,
ADD COLUMN organization_location_name TEXT;

-- Add unique constraint for organization names
-- Note: This allows NULL values (users without organization profiles)
CREATE UNIQUE INDEX unique_organization_name 
ON profiles(organization_name) 
WHERE organization_name IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN profiles.organization_location_id IS 'Foursquare venue ID for organization location';
COMMENT ON COLUMN profiles.organization_location_name IS 'Display name for organization location';
COMMENT ON INDEX unique_organization_name IS 'Ensures organization names are unique across all profiles';
