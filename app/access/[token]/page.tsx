'use client';

import { useEffect, useState } from 'react';
import { verifyAndLoginGuest } from '@/actions/guest-auth';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function GuestAccessPage({ params }: { params: Promise<{ token: string }> }) {
    const [status, setStatus] = useState<'loading' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const login = async () => {
            try {
                const resolvedParams = await params;
                const token = resolvedParams.token;

                if (!token) {
                    setStatus('error');
                    setErrorMessage('トークンが見つかりません');
                    return;
                }

                const result = await verifyAndLoginGuest(token);
                if (result && result.error) {
                    setStatus('error');
                    setErrorMessage('無効な招待リンクか、有効期限が切れています。');
                }
            } catch (error) {
                console.error('Login failed:', error);
                setStatus('error');
                setErrorMessage('ログイン処理中にエラーが発生しました。');
            }
        };

        login();
    }, [params]);

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">アクセスできません</h1>
                    <p className="text-gray-600 mb-6">{errorMessage}</p>
                    <Link href="/login">
                        <Button className="w-full">ログインページへ戻る</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700">チームに参加中...</h2>
                <p className="text-gray-500 mt-2">ダッシュボードへ移動しています</p>
            </div>
        </div>
    );
}
