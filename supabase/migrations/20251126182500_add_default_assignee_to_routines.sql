-- Add default assignee to routines
ALTER TABLE public.routines
ADD COLUMN IF NOT EXISTS default_assignee_id UUID REFERENCES public.users(id);

-- キャッシュリロード
NOTIFY pgrst, 'reload config';
