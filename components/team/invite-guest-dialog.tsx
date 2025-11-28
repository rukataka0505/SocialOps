'use client';

import { useState } from 'react';
import { createGuest } from '@/actions/guests';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Copy, Loader2, UserPlus, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface InviteGuestDialogProps {
    onGuestCreated?: () => void;
    children?: React.ReactNode;
}

export function InviteGuestDialog({ onGuestCreated, children }: InviteGuestDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [accessUrl, setAccessUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCreateGuest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestName.trim()) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', guestName);
            // Default to member role for guests
            formData.append('role', 'member');

            const result = await createGuest(formData);

            if (result.success) {
                const url = `${window.location.origin}/access/${result.accessToken}`;
                setAccessUrl(url);
                if (onGuestCreated) {
                    onGuestCreated();
                }
            }
        } catch (error) {
            console.error('Failed to create guest:', error);
            alert('ゲストユーザーの作成に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopy = async () => {
        if (!accessUrl) return;
        try {
            await navigator.clipboard.writeText(accessUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            // Reset state when closed
            setTimeout(() => {
                setAccessUrl(null);
                setGuestName('');
                setCopied(false);
            }, 300);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline">
                        <UserPlus className="mr-2 h-4 w-4" />
                        ゲストを招待
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        ゲストアクセスを発行
                    </DialogTitle>
                    <DialogDescription>
                        アカウント登録不要でアクセスできる専用URLを発行します。
                        <br />
                        外部パートナーや一時的なメンバーに最適です。
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {!accessUrl ? (
                        <form onSubmit={handleCreateGuest} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="guest-name">ゲストの表示名 <span className="text-red-500">*</span></Label>
                                <Input
                                    id="guest-name"
                                    placeholder="例: アルバイトAさん、外部ライターBさん"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <Button type="submit" disabled={isSubmitting || !guestName.trim()} className="w-full">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                リンクを発行する
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <Alert className="bg-green-50 text-green-800 border-green-200">
                                <Check className="h-4 w-4" />
                                <AlertTitle>発行完了</AlertTitle>
                                <AlertDescription>
                                    ゲストユーザー「{guestName}」を作成しました。
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <Label>アクセス用URL</Label>
                                <div className="flex items-center gap-2">
                                    <Input value={accessUrl} readOnly className="font-mono text-sm" />
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={handleCopy}
                                        className={copied ? "text-green-600 border-green-600" : ""}
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="text-sm text-muted-foreground bg-slate-50 p-3 rounded-md border">
                                <p>このURLを共有してください。ログインなしで直接アクセスできます。</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
