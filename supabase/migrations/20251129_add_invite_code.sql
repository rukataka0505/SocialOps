-- Add invite_code column to teams table
ALTER TABLE teams ADD COLUMN invite_code text UNIQUE;

-- Generate random invite codes for existing teams (optional, but good for consistency)
-- Note: pgcrypto extension is needed for gen_random_uuid(), but we can just use a placeholder or leave null for old teams if acceptable.
-- For now, we will just add the column. The application logic should handle nulls or we can update them manually if needed.
-- If we want to enforce NOT NULL, we would need to backfill.
-- Let's make it nullable for now to avoid issues with existing data, or default to a random string if possible.
-- However, standard SQL doesn't have a simple short random string function without extensions.
-- So we will leave it nullable for existing rows, but the app will enforce it for new ones.
-- Actually, the requirement said "not null", so we should probably try to fill it.
-- But without a simple random function, it's hard in pure SQL without extensions.
-- Let's stick to adding the column first. If the user wants to backfill, they can do it via a script or we can try to use UUIDs.

-- Attempt to use UUID as default if possible, or just leave it nullable for now and let the app handle it.
-- Requirement: "Default value: Random string generation function (or part of UUID)".
-- Let's try to use substring of md5 of random text or uuid.

UPDATE teams SET invite_code = substr(md5(random()::text), 1, 12) WHERE invite_code IS NULL;

-- Now make it not null and unique
ALTER TABLE teams ALTER COLUMN invite_code SET NOT NULL;
