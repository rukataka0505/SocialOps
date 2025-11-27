-- 既存のポリシーがあれば削除してエラーを回避（ここが重要！）
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;

-- 改めてポリシーを作成する
CREATE POLICY "Users can create teams"
ON public.teams
FOR INSERT
TO authenticated
WITH CHECK (true);