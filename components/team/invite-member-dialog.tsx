'use client';

import { useState } from 'react';
import { getInviteCode } from '@/actions/teams';
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
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGetCode = async () => {
        setIsLoading(true);
        try {
            const code = await getInviteCode(teamId);
            setInviteCode(code ?? null);
        } catch (error) {
            console.error('Failed to get invite code:', error);
            alert('招待コードの取得に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!inviteCode) return;
        try {
            await navigator.clipboard.writeText(inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open && !inviteCode) {
            handleGetCode();
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

                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>チーム招待コード</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={inviteCode || ''}
                                        readOnly
                                        className="font-mono text-xl text-center tracking-widest font-bold"
                                    />
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
                                <p className="mb-2">このコードをメンバーに共有してください。</p>
                                <p>メンバーはチーム切り替えメニューの<strong>「招待コードで参加」</strong>から入力します。</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
