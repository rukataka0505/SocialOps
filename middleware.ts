import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log("--- ENV DEBUG ---");
    console.log("URL:", supabaseUrl);
    console.log("Key:", supabaseAnonKey);
    if (!supabaseUrl || !supabaseAnonKey ||
        supabaseUrl === 'your-project-url' ||
        supabaseAnonKey === 'your-anon-key') {
        console.error('❌ Supabase環境変数が設定されていません！');
        console.error('📝 .env.localファイルを開いて、以下の値を実際のSupabaseプロジェクトの値に置き換えてください:');
        console.error('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
        console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
        console.error('');
        console.error('💡 Supabaseダッシュボード → Settings → API で確認できます');

        // Return a helpful error page instead of crashing
        return new NextResponse(
            `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>環境変数の設定が必要です</title>
<style>
body {
  font-family: system-ui, -apple-system, sans-serif;
  max-width: 600px;
  margin: 100px auto;
  padding: 20px;
  background: #f5f5f5;
}
.error-box {
  background: white;
  border-left: 4px solid #ef4444;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
h1 { color: #ef4444; margin-top: 0; }
code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}
.step {
  margin: 15px 0;
  padding-left: 20px;
}
</style>
</head>
<body>
<div class="error-box">
<h1>⚠️ 環境変数の設定が必要です</h1>
<p>Supabaseの接続情報が設定されていません。以下の手順で設定してください：</p>

<div class="step">
<strong>1. Supabaseダッシュボードを開く</strong><br>
<a href="https://supabase.com/dashboard" target="_blank">https://supabase.com/dashboard</a>
</div>

<div class="step">
<strong>2. プロジェクトを選択 → Settings → API</strong><br>
以下の情報をコピーします：
<ul>
<li>Project URL</li>
<li>anon public key</li>
</ul>
</div>

<div class="step">
<strong>3. <code>.env.local</code> ファイルを編集</strong><br>
プロジェクトルートの <code>.env.local</code> を開いて、以下のように設定：
<pre style="background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 4px; overflow-x: auto;">
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</pre>
</div>

<div class="step">
<strong>4. 開発サーバーを再起動</strong><br>
ターミナルで <code>Ctrl+C</code> で停止 → <code>npm run dev</code> で再起動
</div>
</div>
</body>
</html>`,
            {
                status: 500,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
        );
    }

    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if expired - required for Server Components
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const isAuthRoute = request.nextUrl.pathname.startsWith('/login');
    const isProtectedRoute = request.nextUrl.pathname === '/' ||
        request.nextUrl.pathname.startsWith('/clients') ||
        request.nextUrl.pathname.startsWith('/settings');

    // Redirect authenticated users away from login page
    if (isAuthRoute && user) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    // Redirect unauthenticated users to login page
    if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
