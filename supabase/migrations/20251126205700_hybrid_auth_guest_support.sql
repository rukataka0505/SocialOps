-- SocialOps v9.0 "Hybrid Auth" - Guest User Support Migration
-- This migration enables guest users (users without Supabase Auth accounts)

-- 1. Drop the foreign key constraint from public.users.id to auth.users.id
-- This allows creating user records without corresponding auth records
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 2. Remove default value from public.users.id if it references auth.uid()
-- The application will be responsible for generating UUIDs for guest users
ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;

-- 3. Add access_token column to team_members for guest authentication
-- This token will be used as a "key" for guests to access teams without login
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS access_token TEXT UNIQUE;

-- 4. Create index on access_token for efficient token lookups
CREATE INDEX IF NOT EXISTS idx_team_members_token ON public.team_members(access_token);

-- 5. Add comment to document the purpose of access_token
COMMENT ON COLUMN public.team_members.access_token IS 'Authentication token for guest users to access team resources without Supabase Auth login';

-- Reload Supabase config
NOTIFY pgrst, 'reload config';
