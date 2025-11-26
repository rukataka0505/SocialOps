'use client';

import { useState } from 'react';
import { createInvitation } from '@/actions/teams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, Loader2 } from 'lucide-react';

export function InviteSection({ teamId }: { teamId: string }) {
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const { token } = await createInvitation(teamId);
            const url = `${window.location.origin}/invite/${token}`;
            setInviteUrl(url);
            setIsCopied(false);
        } catch (error) {
            console.error('Failed to generate invitation:', error);
            alert('招待リンクの発行に失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!inviteUrl) return;
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    return (
        <div className="space-y-4">
            {!inviteUrl ? (
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    招待リンクを発行
                </Button>
            ) : (
                <div className="flex gap-2 items-center max-w-xl">
                    <Input value={inviteUrl} readOnly className="font-mono text-sm" />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopy}
                        className={isCopied ? 'text-green-600 border-green-600' : ''}
                    >
                        {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" onClick={() => setInviteUrl(null)} className="text-sm text-gray-500">
                        リセット
                    </Button>
                </div>
            )}
        </div>
    );
}
