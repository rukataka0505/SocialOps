'use client';

import { useState, useEffect } from 'react';
import { createGuest, getGuests, revokeGuestAccess, deleteGuest } from '@/actions/guests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Copy, Loader2, Trash2, ShieldOff, UserPlus } from 'lucide-react';

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

export function GuestSection({ teamId, className }: { teamId: string; className?: string }) {
    const [guests, setGuests] = useState<Guest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [newGuestName, setNewGuestName] = useState('');
    const [newGuestRole, setNewGuestRole] = useState<'member' | 'admin'>('member');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Load guests on mount
    useEffect(() => {
        loadGuests();
    }, []);

    const loadGuests = async () => {
        setIsLoading(true);
        try {
            const guestList = await getGuests();
            setGuests(guestList);
        } catch (error) {
            console.error('Failed to load guests:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGuest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGuestName.trim()) return;

        setIsSubmitting(true);
        setSuccessMessage(null);

        try {
            const formData = new FormData();
            formData.append('name', newGuestName);
            formData.append('role', newGuestRole);

            const result = await createGuest(formData);

            if (result.success) {
                // Generate the access URL
                const accessUrl = `${window.location.origin}/access/${result.accessToken}`;

                // Copy to clipboard automatically
                await navigator.clipboard.writeText(accessUrl);

                setSuccessMessage(`${result.name} を追加しました！アクセスURLをクリップボードにコピーしました。`);
                setNewGuestName('');
                setNewGuestRole('member');

                // Reload guest list
                await loadGuests();

                // Clear success message after 5 seconds
                setTimeout(() => setSuccessMessage(null), 5000);
            }
        } catch (error: any) {
            console.error('Failed to create guest:', error);
            alert(error.message || 'ゲストユーザーの作成に失敗しました。');
        } finally {
            setIsSubmitting(false);
        }
    };

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

        try {
            await revokeGuestAccess(memberId);
            alert('アクセス権を停止しました。新しいURLが生成されています。');
            await loadGuests();
        } catch (error: any) {
            console.error('Failed to revoke access:', error);
            alert(error.message || 'アクセス権の停止に失敗しました。');
        }
    };

    const handleDeleteGuest = async (memberId: string, guestName: string) => {
        if (!confirm(`${guestName} を完全に削除しますか？\nこの操作は取り消せません。`)) {
            return;
        }

        try {
            await deleteGuest(memberId);
            alert('ゲストユーザーを削除しました。');
            await loadGuests();
        } catch (error: any) {
            console.error('Failed to delete guest:', error);
            alert(error.message || 'ゲストユーザーの削除に失敗しました。');
        }
    };

    return (
        <div className={`space-y-6 ${className || ''}`}>
            {/* Add Guest Form */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    ゲストメンバーを追加
                </h3>
                <form onSubmit={handleCreateGuest} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <Label htmlFor="guest-name">名前</Label>
                            <Input
                                id="guest-name"
                                type="text"
                                placeholder="例: アルバイトAさん"
                                value={newGuestName}
                                onChange={(e) => setNewGuestName(e.target.value)}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <Label htmlFor="guest-role">権限</Label>
                            <select
                                id="guest-role"
                                value={newGuestRole}
                                onChange={(e) => setNewGuestRole(e.target.value as 'member' | 'admin')}
                                disabled={isSubmitting}
                                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="member">メンバー</option>
                                <option value="admin">管理者</option>
                            </select>
                        </div>
                    </div>
                    <Button type="submit" disabled={isSubmitting || !newGuestName.trim()}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        追加
                    </Button>
                </form>
                {successMessage && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
                        {successMessage}
                    </div>
                )}
            </div>

            {/* Guest List */}
            <div>
                <h3 className="text-lg font-semibold mb-3">ゲストメンバー一覧</h3>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : guests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        ゲストメンバーはまだ登録されていません。
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b">
                                    <th className="pb-2 font-medium text-gray-500">名前</th>
                                    <th className="pb-2 font-medium text-gray-500">権限</th>
                                    <th className="pb-2 font-medium text-gray-500">アクセスリンク</th>
                                    <th className="pb-2 font-medium text-gray-500">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {guests.map((guest) => (
                                    <tr key={guest.id} className="group">
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-purple-600">
                                                        {guest.user.name[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                <span>{guest.user.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                {guest.role}
                                            </span>
                                        </td>
                                        <td className="py-3">
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
                                        <td className="py-3">
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRevokeAccess(guest.id, guest.user.name)}
                                                    title="アクセス権を停止"
                                                >
                                                    <ShieldOff className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteGuest(guest.id, guest.user.name)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    title="削除"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
