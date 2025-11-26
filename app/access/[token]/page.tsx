'use client';

import { useEffect, useState } from 'react';
import { verifyAndLoginGuest } from '@/actions/guest-auth';
import { updateProfile } from '@/actions/user';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function GuestAccessPage({ params }: { params: Promise<{ token: string }> }) {
    const [status, setStatus] = useState<'verifying' | 'editing' | 'completed' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');
    const [name, setName] = useState('');
    const [teamName, setTeamName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

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
                } else if (result && result.success) {
                    // Success! Move to editing step
                    // @ts-ignore - result.user is typed as any in some contexts, but we know it exists
                    setName(result.user?.name || result.user?.email || '');
                    // @ts-ignore
                    setTeamName(result.teamName || 'チーム');
                    setStatus('editing');
                }
            } catch (error) {
                console.error('Login failed:', error);
                setStatus('error');
                setErrorMessage('ログイン処理中にエラーが発生しました。');
            }
        };

        login();
    }, [params]);

    const handleJoin = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            await updateProfile(formData);
            setStatus('completed');
            router.push('/');
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('プロフィールの更新に失敗しました。');
            setIsSaving(false);
        }
    };

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

    if (status === 'editing') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                        {teamName}へようこそ！
                    </h1>
                    <p className="text-gray-600 text-center mb-8">
                        チームメンバーとして表示される名前を確認してください。
                    </p>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-gray-700">
                                表示名
                            </label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="名前を入力"
                                className="w-full"
                            />
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleJoin}
                            disabled={isSaving || !name.trim()}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    設定中...
                                </>
                            ) : (
                                'チームに参加する'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700">読み込み中...</h2>
                <p className="text-gray-500 mt-2">招待情報を確認しています</p>
            </div>
        </div>
    );
}
