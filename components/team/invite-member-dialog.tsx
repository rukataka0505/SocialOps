'use client';

import { useState } from 'react';
import { createInvitation } from '@/actions/teams';
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
import { Check, Copy, Loader2, UserPlus, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface InviteMemberDialogProps {
    teamId: string;
    children?: React.ReactNode;
}

export function InviteMemberDialog({ teamId, children }: InviteMemberDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCreateInvite = async () => {
        setIsLoading(true);
        try {
            const { token } = await createInvitation(teamId);
            const url = `${window.location.origin}/invite/${token}`;
            setInviteUrl(url);
        } catch (error) {
            console.error('Failed to create invitation:', error);
            alert('招待リンクの作成に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!inviteUrl) return;
        try {
            await navigator.clipboard.writeText(inviteUrl);
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
                setInviteUrl(null);
                setCopied(false);
            }, 300);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children || (
                    <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        メンバーを招待
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        正規メンバーを招待
                    </DialogTitle>
                    <DialogDescription>
                        チームの正規メンバーとして招待します。
                        <br />
                        <strong>参加にはアカウント作成（ログイン）が必要です。</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
                        <AlertTitle className="font-semibold">正規メンバーとは？</AlertTitle>
                        <AlertDescription className="text-sm mt-1">
                            SocialOpsのアカウントを持ち、チームの共同作業者として全ての機能を利用できるユーザーです。
                        </AlertDescription>
                    </Alert>

                    {!inviteUrl ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-4">
                            <Button onClick={handleCreateInvite} disabled={isLoading} className="w-full">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                招待リンクを発行する
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                リンクの有効期限は7日間です。
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>招待リンク</Label>
                                <div className="flex items-center gap-2">
                                    <Input value={inviteUrl} readOnly className="font-mono text-sm" />
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
                                <p>このリンクを知っている人は誰でもチームに参加できます。</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
