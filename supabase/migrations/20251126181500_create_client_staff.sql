-- クライアント担当者管理
CREATE TABLE public.client_staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role_name TEXT NOT NULL, -- 例: 'Director', 'Editor', 'Designer' (自由入力可だが、Selectで推奨値を出す)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, user_id) -- 1人が同じ案件に重複して登録されないように
);
