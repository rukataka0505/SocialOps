"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login as loginAction, signup as signupAction } from "@/actions/auth";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { motion } from "framer-motion";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const initialState = {
    message: "",
};

export default function LoginPage() {
    const [loginState, loginDispatch, isLoginPending] = useActionState(
        loginAction,
        initialState
    );
    const [signupState, signupDispatch, isSignupPending] = useActionState(
        signupAction,
        initialState
    );

    const searchParams = useSearchParams();
    const next = searchParams.get("next");
    const mode = searchParams.get("mode");
    const [isSignup, setIsSignup] = useState(mode === "signup");

    const currentState = isSignup ? signupState : loginState;
    const currentAction = isSignup ? signupDispatch : loginDispatch;
    const isPending = isSignup ? isSignupPending : isLoginPending;

    return (
        <div className="min-h-screen w-full bg-[#09090B] flex items-center justify-center relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272A_1px,transparent_1px),linear-gradient(to_bottom,#27272A_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md px-4"
            >
                <div className="mb-8 text-center">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="h-6 w-6 rounded bg-blue-600" />
                        <span className="text-xl font-bold text-white tracking-tight">SocialOps</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                        {isSignup ? "アカウントを作成" : "おかえりなさい"}
                    </h1>
                    <p className="text-zinc-400 text-sm">
                        {isSignup
                            ? "チームに参加して、SNS運用を始めましょう。"
                            : "アカウントにログインして作業を続けましょう。"}
                    </p>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm shadow-2xl">
                    <form action={currentAction} className="space-y-4">
                        {next && <input type="hidden" name="next" value={next} />}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-300">メールアドレス</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-blue-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-zinc-300">パスワード</Label>
                                {!isSignup && (
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs text-blue-500 hover:text-blue-400"
                                    >
                                        パスワードをお忘れですか？
                                    </Link>
                                )}
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-blue-600"
                            />
                        </div>

                        {currentState?.message && (
                            <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {currentState.message}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-white text-black hover:bg-zinc-200"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                isSignup ? "登録する" : "ログイン"
                            )}
                        </Button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#121215] px-2 text-zinc-500">
                                    または
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <SocialAuthButtons />
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center text-sm">
                    <span className="text-zinc-500">
                        {isSignup ? "すでにアカウントをお持ちですか？" : "アカウントをお持ちでないですか？"}
                    </span>{" "}
                    <button
                        type="button"
                        onClick={() => setIsSignup(!isSignup)}
                        className="font-medium text-blue-500 hover:text-blue-400 hover:underline transition-colors"
                    >
                        {isSignup ? "ログイン" : "新規登録"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
