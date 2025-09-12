-- Add full_name column to profile table
-- This migration adds a full_name column to store customer names properly

-- Add the full_name column to profile table
ALTER TABLE profile ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Add an index for better query performance on full_name
CREATE INDEX IF NOT EXISTS idx_profile_full_name ON profile(full_name);

-- Update the profile table comment to reflect the new column
COMMENT ON COLUMN profile.full_name IS 'Full name of the user for display purposes';

-- Optional: Update existing profiles with a default name format if email exists
-- This can be run separately if needed
-- UPDATE profile 
-- SET full_name = COALESCE(full_name, 'Customer')
-- WHERE full_name IS NULL AND email IS NOT NULL;

-- Create a function to automatically set a default name when a profile is created
CREATE OR REPLACE FUNCTION set_default_full_name()
RETURNS TRIGGER AS $$
BEGIN
    -- If full_name is null or empty, set it to 'Customer' as a default
    IF NEW.full_name IS NULL OR NEW.full_name = '' THEN
        NEW.full_name := 'Customer';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set default name on profile insert
DROP TRIGGER IF EXISTS trigger_set_default_full_name ON profile;
CREATE TRIGGER trigger_set_default_full_name
    BEFORE INSERT ON profile
    FOR EACH ROW
    EXECUTE FUNCTION set_default_full_name();

-- Display success message
SELECT 'Migration completed: Added full_name column to profile table' as status;