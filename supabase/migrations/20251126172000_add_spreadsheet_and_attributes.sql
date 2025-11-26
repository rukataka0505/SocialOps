-- 1. Add spreadsheet_url to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS spreadsheet_url TEXT;

-- 2. Add attributes to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;

-- Reload Supabase config
NOTIFY pgrst, 'reload config';
