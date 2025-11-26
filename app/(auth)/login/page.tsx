"use client";

import { useState, useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { login, signup } from "@/actions/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

function LoginForm() {
    const searchParams = useSearchParams();
    const next = searchParams.get("next");
    const mode = searchParams.get("mode");
    const [isSignup, setIsSignup] = useState(mode === "signup");

    const [loginState, loginAction, isLoginPending] = useActionState(login, null);
    const [signupState, signupAction, isSignupPending] = useActionState(signup, null);

    const currentState = isSignup ? signupState : loginState;
    const currentAction = isSignup ? signupAction : loginAction;
    const isPending = isSignup ? isSignupPending : isLoginPending;

    return (
        <Card className="w-full max-w-md shadow-2xl bg-slate-900/50 backdrop-blur-md border-slate-800 text-slate-200">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center text-white">
                    {isSignup ? "新規登録" : "ログイン"}
                </CardTitle>
                <CardDescription className="text-center text-slate-400">
                    {isSignup
                        ? "アカウントを作成してSocialOpsを始めましょう"
                        : "メールアドレスとパスワードを入力してください"}
                </CardDescription>
            </CardHeader>
            <form action={currentAction}>
                {next && <input type="hidden" name="next" value={next} />}
                <CardContent className="space-y-4">
                    {currentState?.error && (
                        <Alert variant="destructive" className="bg-red-900/50 border-red-900 text-red-200">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{currentState.error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-300">メールアドレス</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="example@email.com"
                            required
                            disabled={isPending}
                            autoComplete="email"
                            className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-purple-500 focus:ring-purple-500/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-300">パスワード</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder={isSignup ? "6文字以上" : "••••••••"}
                            required
                            disabled={isPending}
                            autoComplete={isSignup ? "new-password" : "current-password"}
                            minLength={6}
                            className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-purple-500 focus:ring-purple-500/20"
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold shadow-lg shadow-purple-500/25 border-0"
                        disabled={isPending}
                    >
                        {isPending ? "処理中..." : (isSignup ? "登録" : "ログイン")}
                    </Button>

                    <div className="text-sm text-center text-slate-500">
                        {isSignup ? "既にアカウントをお持ちですか？" : "アカウントをお持ちでない方"}
                        <Button
                            type="button"
                            variant="link"
                            className="pl-1 text-purple-400 hover:text-purple-300"
                            onClick={() => setIsSignup(!isSignup)}
                            disabled={isPending}
                        >
                            {isSignup ? "ログイン" : "新規登録"}
                        </Button>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl mix-blend-screen animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl mix-blend-screen" />
            </div>

            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
