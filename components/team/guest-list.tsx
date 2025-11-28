'use client';

import { useState } from 'react';
import { revokeGuestAccess, deleteGuest } from '@/actions/guests';
import { Button } from '@/components/ui/button';
import { Check, Copy, ShieldOff, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Guest {
    id: string;
    role: string;
    access_token: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

interface GuestListProps {
    guests: Guest[];
    onUpdate?: () => void;
}

export function GuestList({ guests, onUpdate }: GuestListProps) {
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleCopyLink = async (token: string) => {
        const accessUrl = `${window.location.origin}/access/${token}`;
        try {
            await navigator.clipboard.writeText(accessUrl);
            setCopiedToken(token);
            setTimeout(() => setCopiedToken(null), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleRevokeAccess = async (memberId: string, guestName: string) => {
        if (!confirm(`${guestName} のアクセス権を停止しますか？\n現在のURLは使用できなくなり、新しいURLが生成されます。`)) {
            return;
        }

        setIsLoading(memberId);
        try {
            await revokeGuestAccess(memberId);
            alert('アクセス権を停止しました。新しいURLが生成されています。');
            if (onUpdate) onUpdate();
        } catch (error: any) {
            console.error('Failed to revoke access:', error);
            alert(error.message || 'アクセス権の停止に失敗しました。');
        } finally {
            setIsLoading(null);
        }
    };

    const handleDeleteGuest = async (memberId: string, guestName: string) => {
        if (!confirm(`${guestName} を完全に削除しますか？\nこの操作は取り消せません。`)) {
            return;
        }

        setIsLoading(memberId);
        try {
            await deleteGuest(memberId);
            alert('ゲストユーザーを削除しました。');
            if (onUpdate) onUpdate();
        } catch (error: any) {
            console.error('Failed to delete guest:', error);
            alert(error.message || 'ゲストユーザーの削除に失敗しました。');
        } finally {
            setIsLoading(null);
        }
    };

    if (guests.length === 0) {
        return (
            <div className="text-center py-12 border rounded-md bg-slate-50">
                <p className="text-muted-foreground">ゲストメンバーはまだ登録されていません。</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">名前</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">権限</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">アクセスリンク</th>
                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">操作</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {guests.map((guest) => (
                            <tr key={guest.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <td className="p-4 align-middle">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                            <span className="text-sm font-medium text-purple-600">
                                                {guest.user.name[0].toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="font-medium">{guest.user.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 align-middle">
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                                        ゲスト
                                    </Badge>
                                </td>
                                <td className="p-4 align-middle">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopyLink(guest.access_token)}
                                        className={copiedToken === guest.access_token ? 'text-green-600 border-green-600' : ''}
                                    >
                                        {copiedToken === guest.access_token ? (
                                            <>
                                                <Check className="mr-2 h-4 w-4" />
                                                コピー済み
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="mr-2 h-4 w-4" />
                                                リンクをコピー
                                            </>
                                        )}
                                    </Button>
                                </td>
                                <td className="p-4 align-middle text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRevokeAccess(guest.id, guest.user.name)}
                                            title="アクセス権を停止"
                                            disabled={isLoading === guest.id}
                                        >
                                            <ShieldOff className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteGuest(guest.id, guest.user.name)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            title="削除"
                                            disabled={isLoading === guest.id}
                                        >
                                            {isLoading === guest.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
