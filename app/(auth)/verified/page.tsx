'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

function VerifiedContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get('next') || '/onboarding';
    const [timeLeft, setTimeLeft] = useState(3);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push(next);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router, next]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/20 rounded-full blur-3xl mix-blend-screen animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl mix-blend-screen" />
            </div>

            <Card className="w-full max-w-md shadow-2xl bg-slate-900/50 backdrop-blur-md border-slate-800 text-slate-200">
                <CardHeader className="space-y-1 flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center text-white">
                        メール認証が完了しました
                    </CardTitle>
                    <CardDescription className="text-center text-slate-400">
                        アカウントの確認が完了しました。
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-slate-300 space-y-4">
                    <p>
                        まもなくダッシュボードへ移動します...
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{timeLeft}秒後に自動的に移動します</span>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button
                        onClick={() => router.push(next)}
                        className="bg-green-600 hover:bg-green-500 text-white w-full sm:w-auto"
                    >
                        ダッシュボードへ移動
                        <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function VerifiedPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        }>
            <VerifiedContent />
        </Suspense>
    );
}
