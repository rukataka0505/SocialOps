-- 1. Check for triggers specifically on the public.users table
SELECT 
    trigger_name,
    action_statement as trigger_definition
FROM information_schema.triggers
WHERE event_object_schema = 'public' 
AND event_object_table = 'users';

-- 2. Check the most recently created team to see its name (might give a clue)
SELECT * FROM public.teams ORDER BY created_at DESC LIMIT 1;
