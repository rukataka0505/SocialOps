import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl mix-blend-screen animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl mix-blend-screen" />
            </div>

            <Card className="w-full max-w-md shadow-2xl bg-slate-900/50 backdrop-blur-md border-slate-800 text-slate-200">
                <CardHeader className="space-y-1 flex flex-col items-center">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                        <Mail className="w-6 h-6 text-purple-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center text-white">
                        メールを確認してください
                    </CardTitle>
                    <CardDescription className="text-center text-slate-400">
                        ご登録いただいたメールアドレスに確認リンクを送信しました。
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-slate-300 space-y-4">
                    <p>
                        メール内のリンクをクリックして、登録を完了してください。
                    </p>
                    <p className="text-sm text-slate-500">
                        メールが届かない場合は、迷惑メールフォルダもご確認ください。
                    </p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button asChild variant="ghost" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
                        <Link href="/login">
                            ログイン画面に戻る
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
