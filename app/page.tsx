import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link"; // ★追加

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">SocialOps Dashboard</h1>
              <p className="text-muted-foreground mt-2">ようこそ、{user.email}</p>
            </div>
            <form action={logout}>
              <Button variant="outline" type="submit">
                ログアウト
              </Button>
            </form>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* ★修正: Linkで包む & ホバー時の色変化を追加 */}
            <Link href="/clients" className="block h-full">
              <Card className="h-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle>クライアント管理</CardTitle>
                  <CardDescription>顧客情報の管理</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    クライアント情報を一元管理できます
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* タスク管理 (v7.0仕様ではダッシュボード自体がタスク一覧になる予定ですが、一旦プレースホルダー) */}
            <Card className="h-full opacity-60">
              <CardHeader>
                <CardTitle>タスク管理</CardTitle>
                <CardDescription>業務タスクの追跡</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  日々のタスクを効率的に管理 (開発中)
                </p>
              </CardContent>
            </Card>

            {/* ルーティン (クライアント詳細の中に機能があるので、クライアント管理へ飛ばす) */}
            <Link href="/clients" className="block h-full">
              <Card className="h-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle>ルーティン</CardTitle>
                  <CardDescription>定期業務の自動化</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    繰り返しタスクを自動生成
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>認証情報</CardTitle>
              <CardDescription>現在のセッション情報</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ユーザーID:</span>
                <span className="font-mono">{user.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">メールアドレス:</span>
                <span>{user.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">認証状態:</span>
                <span className="text-green-600 font-medium">✓ 認証済み</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}