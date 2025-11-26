-- Check the source code of the handle_new_user function
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';
