-- Add notification_preferences column to profiles table
-- This column stores user notification preferences as JSONB

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "likes": true,
  "comments": true,
  "followers": true,
  "nearby_cheers": false,
  "venue_events": false,
  "app_updates": true
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN profiles.notification_preferences IS 'User notification preferences stored as JSONB object with keys: likes, comments, followers, nearby_cheers, venue_events, app_updates';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_notification_preferences ON profiles USING gin (notification_preferences);
