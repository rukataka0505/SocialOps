'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinTeamByCode } from '@/actions/teams';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface JoinTeamDialogProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function JoinTeamDialog({ children, open, onOpenChange }: JoinTeamDialogProps) {
    const router = useRouter();
    const [inviteCode, setInviteCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCode.trim()) return;

        setIsSubmitting(true);
        try {
            const result = await joinTeamByCode(inviteCode);

            if (result.success) {
                toast.success("チームに参加しました", {
                    description: `チーム「${result.teamName}」に参加しました。`,
                });
                setIsOpen(false);
                setInviteCode('');
                // Redirect to dashboard
                window.location.href = '/dashboard';
            }
        } catch (error) {
            console.error('Failed to join team:', error);
            toast.error("参加に失敗しました", {
                description: "招待コードが正しくないか、有効期限が切れている可能性があります。",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>招待コードで参加</DialogTitle>
                    <DialogDescription>
                        管理者から共有された招待コードを入力して、チームに参加しましょう。
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleJoin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="invite-code">招待コード</Label>
                        <Input
                            id="invite-code"
                            placeholder="例: xxxxx-xxxxx"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting || !inviteCode.trim()}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    参加中...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    参加する
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
