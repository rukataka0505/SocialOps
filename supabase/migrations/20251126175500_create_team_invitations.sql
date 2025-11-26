-- 招待リンク管理
CREATE TABLE public.team_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL UNIQUE, -- ランダムな招待コード
    role TEXT DEFAULT 'member', -- 将来の拡張用
    expires_at TIMESTAMPTZ NOT NULL,
    max_uses INT, -- NULL = 無制限
    used_count INT DEFAULT 0,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON public.team_invitations(token);

-- キャッシュリロード
NOTIFY pgrst, 'reload config';
