-- List all triggers in the public schema and auth schema (if accessible)
SELECT 
    event_object_schema as schema_name,
    event_object_table as table_name,
    trigger_name,
    action_statement as trigger_definition
FROM information_schema.triggers
WHERE event_object_schema IN ('public', 'auth')
ORDER BY event_object_schema, event_object_table;
