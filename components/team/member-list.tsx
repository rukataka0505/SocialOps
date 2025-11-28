'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, UserCog } from 'lucide-react';
import { removeMember, updateMemberRole } from '@/actions/teams';
import { Badge } from '@/components/ui/badge';

interface Member {
    role: string;
    created_at: string;
    user: {
        id: string;
        email: string;
        name: string;
        avatar_url: string | null;
    };
}

interface MemberListProps {
    members: Member[];
    currentUserId: string;
    currentUserRole: string;
}

export function MemberList({ members, currentUserId, currentUserRole }: MemberListProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleRemoveMember = async (userId: string, userName: string) => {
        if (!confirm(`${userName} をチームから削除しますか？\nこの操作は取り消せません。`)) {
            return;
        }

        setIsLoading(userId);
        try {
            await removeMember(userId);
        } catch (error) {
            console.error('Failed to remove member:', error);
            alert('メンバーの削除に失敗しました');
        } finally {
            setIsLoading(null);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setIsLoading(userId);
        try {
            await updateMemberRole(userId, newRole);
        } catch (error) {
            console.error('Failed to update role:', error);
            alert('権限の変更に失敗しました');
        } finally {
            setIsLoading(null);
        }
    };

    const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

    return (
        <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">メンバー</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">メールアドレス</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">権限</th>
                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">操作</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {members.map((member) => (
                            <tr key={member.user.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <td className="p-4 align-middle">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={member.user.avatar_url || undefined} />
                                            <AvatarFallback>{member.user.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{member.user.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 align-middle">{member.user.email}</td>
                                <td className="p-4 align-middle">
                                    <Badge variant={member.role === 'owner' ? 'default' : member.role === 'admin' ? 'secondary' : 'outline'}>
                                        {member.role === 'owner' ? 'オーナー' : member.role === 'admin' ? '管理者' : 'メンバー'}
                                    </Badge>
                                </td>
                                <td className="p-4 align-middle text-right">
                                    {canManage && member.user.id !== currentUserId && member.role !== 'owner' && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={isLoading === member.user.id}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleRoleChange(member.user.id, member.role === 'admin' ? 'member' : 'admin')}>
                                                    <UserCog className="mr-2 h-4 w-4" />
                                                    {member.role === 'admin' ? 'メンバーに降格' : '管理者に昇格'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={() => handleRemoveMember(member.user.id, member.user.name)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    チームから削除
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
