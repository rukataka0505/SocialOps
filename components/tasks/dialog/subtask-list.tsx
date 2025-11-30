"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, CheckSquare, Edit2, Plus, Trash2, User, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface TeamMember {
    role: string;
    user: {
        id: string;
        email: string;
        name: string | null;
        avatar_url: string | null;
    };
}

interface SubtaskListProps {
    subtasks: any[];
    members: TeamMember[];
    isEditMode: boolean;
    isPending: boolean;
    isLoading?: boolean;
    newSubtask: {
        title: string;
        dueDate: string;
        assignee: string;
    };
    onNewSubtaskChange: (field: 'title' | 'dueDate' | 'assignee', value: string) => void;
    onAddSubtask: () => void;
    onToggleSubtask: (id: string, status: string) => void;
    onUpdateAssignee: (id: string, userId: string) => void;
    onDeleteSubtask: (id: string) => void;
    onEditSubtask: (id: string) => void;
}

export function SubtaskList({
    subtasks,
    members,
    isEditMode,
    isPending,
    isLoading = false,
    newSubtask,
    onNewSubtaskChange,
    onAddSubtask,
    onToggleSubtask,
    onUpdateAssignee,
    onDeleteSubtask,
    onEditSubtask
}: SubtaskListProps) {
    if (!isEditMode) {
        return (
            <div className="p-8 text-center border-2 border-dashed rounded-xl text-muted-foreground bg-slate-50/50">
                <CheckSquare className="h-8 w-8 mx-auto mb-3 text-slate-300" />
                <p>タスクを作成すると、制作プロセス（サブタスク）を追加できるようになります。</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                    <CheckSquare className="h-5 w-5 text-blue-500" />
                    制作プロセス
                </h3>
                {!isLoading && (
                    <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded-full">
                        {subtasks.filter(s => s.status === 'completed').length} / {subtasks.length} 完了
                    </span>
                )}
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="divide-y">
                    {isLoading ? (
                        // Skeleton Loading
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                                <div className="h-5 w-5 bg-slate-200 rounded" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                                </div>
                                <div className="h-8 w-8 bg-slate-200 rounded-full" />
                            </div>
                        ))
                    ) : (
                        subtasks.map((subtask) => (
                            <div
                                key={subtask.id}
                                className={`grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center p-4 hover:bg-slate-50/50 transition-colors group ${subtask.status === 'completed' ? 'bg-slate-50/80' : ''}`}
                            >
                                <Checkbox
                                    checked={subtask.status === 'completed'}
                                    onCheckedChange={() => onToggleSubtask(subtask.id, subtask.status)}
                                    className="h-5 w-5"
                                />
                                <div className="min-w-0">
                                    <div className={`font-medium truncate ${subtask.status === 'completed' ? 'line-through text-muted-foreground' : 'text-slate-700'}`}>
                                        {subtask.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1.5">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {subtask.due_date ? format(new Date(subtask.due_date), "MM/dd", { locale: ja }) : '-'}
                                        </span>
                                        {subtask.assignments?.[0]?.user && (
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {subtask.assignments[0].user.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Assignee */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                            {subtask.assignments?.[0]?.user ? (
                                                <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                                                    <AvatarImage src={subtask.assignments[0].user.avatar_url || ""} />
                                                    <AvatarFallback>{subtask.assignments[0].user.name?.[0] || "?"}</AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <UserPlus className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground" />
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onUpdateAssignee(subtask.id, "")}>
                                            <div className="flex items-center gap-2 w-full">
                                                <div className="h-6 w-6 rounded-full border border-dashed flex items-center justify-center">
                                                    <User className="h-3 w-3 text-muted-foreground" />
                                                </div>
                                                <span>担当なし</span>
                                            </div>
                                        </DropdownMenuItem>
                                        {members.map((member) => (
                                            <DropdownMenuItem
                                                key={member.user.id}
                                                onClick={() => onUpdateAssignee(subtask.id, member.user.id)}
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={member.user.avatar_url || ""} />
                                                        <AvatarFallback>{member.user.name?.[0] || "?"}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{member.user.name || member.user.email}</span>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                                        onClick={() => onEditSubtask(subtask.id)}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => onDeleteSubtask(subtask.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Add Subtask Row */}
                    <div className="p-3 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <Input
                                placeholder="新しい作業を追加..."
                                value={newSubtask.title}
                                onChange={(e) => onNewSubtaskChange('title', e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                        e.preventDefault();
                                        onAddSubtask();
                                    }
                                }}
                                className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-2 h-9 shadow-none"
                            />
                            <div className="flex items-center gap-2">
                                <Input
                                    type="date"
                                    value={newSubtask.dueDate}
                                    onChange={(e) => onNewSubtaskChange('dueDate', e.target.value)}
                                    className="w-[130px] border-0 bg-transparent focus-visible:ring-0 h-9 shadow-none text-sm text-muted-foreground"
                                />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-9 px-2 text-muted-foreground hover:text-foreground">
                                            {newSubtask.assignee ? (
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={members.find(m => m.user.id === newSubtask.assignee)?.user.avatar_url || ""} />
                                                    <AvatarFallback>{members.find(m => m.user.id === newSubtask.assignee)?.user.name?.[0] || "?"}</AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <UserPlus className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {members.map((member) => (
                                            <DropdownMenuItem
                                                key={member.user.id}
                                                onClick={() => onNewSubtaskChange('assignee', member.user.id)}
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={member.user.avatar_url || ""} />
                                                        <AvatarFallback>{member.user.name?.[0] || "?"}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{member.user.name || member.user.email}</span>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                    type="button"
                                    onClick={onAddSubtask}
                                    disabled={isPending || !newSubtask.title || !newSubtask.dueDate || !newSubtask.assignee}
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
