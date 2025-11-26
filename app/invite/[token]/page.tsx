import { createClient } from '@/lib/supabase/server';
import { getInvitation, joinTeam } from '@/actions/teams';
import { Button } from '@/components/ui/button';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function InvitePage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const invitation = await getInvitation(token);

    if (!invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full p-8 bg-white rounded-lg shadow text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">無効な招待リンク</h1>
                    <p className="text-gray-600 mb-6">
                        この招待リンクは無効か、有効期限が切れています。
                        新しい招待リンクを発行してもらってください。
                    </p>
                    <Link href="/">
                        <Button variant="outline">トップページへ戻る</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    async function handleJoin() {
        'use server';
        await joinTeam(token);
        redirect('/');
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-8 bg-white rounded-lg shadow text-center">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">チームへの招待</h1>
                    <p className="text-gray-600">
                        <span className="font-semibold text-gray-900">{invitation.team.name}</span>{' '}
                        に招待されています。
                    </p>
                </div>

                {user ? (
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded text-left mb-6">
                            <p className="text-sm text-gray-500 mb-1">参加するアカウント:</p>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                    {user.user_metadata?.avatar_url ? (
                                        <img
                                            src={user.user_metadata.avatar_url}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-sm font-medium text-gray-500">
                                            {(user.email || '?')[0].toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-medium truncate">{user.user_metadata?.name || 'No Name'}</p>
                                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                </div>
                            </div>
                        </div>

                        <form action={handleJoin}>
                            <Button type="submit" className="w-full" size="lg">
                                チームに参加する
                            </Button>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500 mb-4">
                            チームに参加するにはログイン、またはアカウント登録が必要です。
                        </p>
                        <Link href={`/login?next=/invite/${token}`}>
                            <Button className="w-full" size="lg">
                                ログイン / 登録して参加
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
