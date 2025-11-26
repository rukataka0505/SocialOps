"use client";

import { useState, useEffect, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMemberTasks } from "@/actions/tasks";
import { updateMemberRole } from "@/actions/teams";
import { format, isPast, isToday } from "date-fns";
import { ja } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface MemberDetailProps {
    member: any;
    children: React.ReactNode;
    currentUserRole?: string;
}

export function MemberDetail({ member, children, currentUserRole }: MemberDetailProps) {
    console.log('[MemberDetail] Rendering for:', member?.user?.name || member?.user?.email);
    console.log('[MemberDetail] Children:', children);
    
    const [tasks, setTasks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            getMemberTasks(member.user.id)
                .then(setTasks)
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, member.user.id]);

    const handleRoleChange = (newRole: string) => {
        startTransition(async () => {
            const result = await updateMemberRole(member.user.id, newRole);
            if (result.success) {
                router.refresh();
            } else {
                alert("権限の変更に失敗しました");
            }
        });
    };

    const overdueTasks = tasks.filter(t => isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)));
    const incompleteTasks = tasks.length;

    const canEditRole = (currentUserRole === 'owner' || currentUserRole === 'admin') && member.role !== 'owner';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>メンバー詳細</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-6">
                    {/* Header Info */}
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={member.user.avatar_url || ""} />
                            <AvatarFallback>{member.user.name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold">{member.user.name || "No Name"}</h3>
                            <p className="text-sm text-muted-foreground">{member.user.email}</p>
                            <div className="mt-2 flex items-center gap-2">
                                <Badge variant="outline" className="capitalize">
                                    {member.role}
                                </Badge>
                                {canEditRole && (
                                    <Select
                                        defaultValue={member.role}
                                        onValueChange={handleRoleChange}
                                        disabled={isPending}
                                    >
                                        <SelectTrigger className="h-6 w-[100px] text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="member">Member</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg border p-3 text-center">
                            <div className="text-2xl font-bold">{incompleteTasks}</div>
                            <div className="text-xs text-muted-foreground">未完了タスク</div>
                        </div>
                        <div className="rounded-lg border p-3 text-center bg-red-50 border-red-100">
                            <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
                            <div className="text-xs text-red-600">期限切れ</div>
                        </div>
                    </div>

                    {/* Task List */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">担当タスク (未完了)</h4>
                        <ScrollArea className="h-[200px] rounded-md border p-2">
                            {isLoading ? (
                                <div className="text-center py-4 text-sm text-muted-foreground">読み込み中...</div>
                            ) : tasks.length === 0 ? (
                                <div className="text-center py-4 text-sm text-muted-foreground">タスクはありません</div>
                            ) : (
                                <div className="space-y-2">
                                    {tasks.map(task => {
                                        const isOverdue = isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
                                        return (
                                            <div key={task.id} className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{task.title}</p>
                                                    <p className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                                                        期限: {format(new Date(task.due_date), "yyyy/MM/dd", { locale: ja })}
                                                    </p>
                                                </div>
                                                <Badge variant={task.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-[10px]">
                                                    {task.priority}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
