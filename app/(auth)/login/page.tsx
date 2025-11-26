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
    const [isSignup, setIsSignup] = useState(false);
    const [loginState, loginAction, isLoginPending] = useActionState(login, null);
    const [signupState, signupAction, isSignupPending] = useActionState(signup, null);
    const searchParams = useSearchParams();
    const next = searchParams.get("next");

    const currentState = isSignup ? signupState : loginState;
    const currentAction = isSignup ? signupAction : loginAction;
    const isPending = isSignup ? isSignupPending : isLoginPending;

    return (
        <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                    {isSignup ? "新規登録" : "ログイン"}
                </CardTitle>
                <CardDescription className="text-center">
                    {isSignup
                        ? "アカウントを作成してSocialOpsを始めましょう"
                        : "メールアドレスとパスワードを入力してください"}
                </CardDescription>
            </CardHeader>
            <form action={currentAction}>
                {next && <input type="hidden" name="next" value={next} />}
                <CardContent className="space-y-4">
                    {currentState?.error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{currentState.error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">メールアドレス</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="example@email.com"
                            required
                            disabled={isPending}
                            autoComplete="email"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">パスワード</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder={isSignup ? "6文字以上" : "••••••••"}
                            required
                            disabled={isPending}
                            autoComplete={isSignup ? "new-password" : "current-password"}
                            minLength={6}
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isPending}
                    >
                        {isPending ? "処理中..." : (isSignup ? "登録" : "ログイン")}
                    </Button>

                    <div className="text-sm text-center text-muted-foreground">
                        {isSignup ? "既にアカウントをお持ちですか？" : "アカウントをお持ちでない方"}
                        <Button
                            type="button"
                            variant="link"
                            className="pl-1"
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
