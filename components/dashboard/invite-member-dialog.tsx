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
import { Check, Copy, Loader2, UserPlus } from 'lucide-react';

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
                    <DialogTitle>メンバーを招待</DialogTitle>
                    <DialogDescription>
                        招待リンクを作成して、新しいメンバーに共有してください。
                        リンクの有効期限は7日間です。
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    {!inviteUrl ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <Button onClick={handleCreateInvite} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                招待リンクを作成
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>招待リンク</Label>
                                <div className="flex items-center gap-2">
                                    <Input value={inviteUrl} readOnly />
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
                            <div className="text-sm text-muted-foreground bg-slate-50 p-3 rounded-md">
                                <p>このリンクを知っている人は誰でもチームに参加できます。</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
