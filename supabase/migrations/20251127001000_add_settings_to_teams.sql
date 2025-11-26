alter table public.teams 
add column if not exists settings jsonb default '{}'::jsonb;
