-- ============================================
-- SocialOps v9.0 Hybrid Auth - Migration Execution & Verification
-- ============================================
-- 
-- STEP 1: Execute the migration
-- Copy and run the contents of: supabase/migrations/20251126205700_hybrid_auth_guest_support.sql
-- in your Supabase SQL Editor
--
-- STEP 2: Run the verification queries below to confirm the changes
-- ============================================

-- Verification Query 1: Check if foreign key constraint was removed
-- Expected: Should return 0 rows (constraint should not exist)
SELECT 
    constraint_name, 
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND constraint_name LIKE '%fkey%';

-- Verification Query 2: Test inserting a guest user (non-auth UUID)
-- Expected: Should succeed without error
INSERT INTO public.users (id, email, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'guest-test@example.com', 'Test Guest User')
ON CONFLICT (id) DO NOTHING;

-- Verification Query 3: Verify the test guest user was created
-- Expected: Should return 1 row
SELECT id, email, name 
FROM public.users 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verification Query 4: Check access_token column exists in team_members
-- Expected: Should return 1 row showing the column details
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'team_members' 
  AND column_name = 'access_token';

-- Verification Query 5: Check unique constraint on access_token
-- Expected: Should return at least 1 row with constraint_type = 'UNIQUE'
SELECT 
    constraint_name, 
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'team_members' 
  AND constraint_type = 'UNIQUE';

-- Verification Query 6: Check index on access_token
-- Expected: Should return 1 row showing the index
SELECT 
    indexname, 
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'team_members' 
  AND indexname = 'idx_team_members_token';

-- Verification Query 7: Test access_token uniqueness
-- Expected: First insert should succeed, second should fail with unique constraint violation
INSERT INTO public.team_members (team_id, user_id, role, access_token)
VALUES (
    (SELECT id FROM public.teams LIMIT 1),
    '00000000-0000-0000-0000-000000000001',
    'member',
    'test-token-12345'
)
ON CONFLICT (id) DO NOTHING;

-- This should fail if run twice (unique constraint violation)
-- INSERT INTO public.team_members (team_id, user_id, role, access_token)
-- VALUES (
--     (SELECT id FROM public.teams LIMIT 1),
--     '00000000-0000-0000-0000-000000000001',
--     'member',
--     'test-token-12345'
-- );

-- Cleanup test data (optional)
-- DELETE FROM public.team_members WHERE access_token = 'test-token-12345';
-- DELETE FROM public.users WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================
-- If all queries above return expected results:
-- ✅ Foreign key constraint removed
-- ✅ Guest users can be created
-- ✅ access_token column exists
-- ✅ Unique constraint on access_token works
-- ✅ Index created for efficient lookups
-- ============================================
