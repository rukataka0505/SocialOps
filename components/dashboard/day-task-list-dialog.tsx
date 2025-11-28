"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Task {
    id: string;
    title: string;
    priority: string;
    status: string;
    assignments: {
        user_id: string;
        user: {
            name: string;
            avatar_url: string | null;
        } | null;
    }[];
    [key: string]: any;
}

interface DayTaskListDialogProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onAddTask: () => void;
}

export function DayTaskListDialog({
    isOpen,
    onClose,
    date,
    tasks,
    onTaskClick,
    onAddTask,
}: DayTaskListDialogProps) {
    const priorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'low': return 'text-slate-600 bg-slate-50 border-slate-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const priorityLabel = (priority: string) => {
        switch (priority) {
            case 'urgent': return '緊急';
            case 'high': return '高';
            case 'medium': return '中';
            case 'low': return '低';
            default: return priority;
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'in_progress': return 'border-l-blue-500';
            case 'pending': return 'border-l-amber-500';
            case 'completed': return 'border-l-slate-400';
            case 'cancelled': return 'border-l-slate-300';
            default: return 'border-l-blue-500';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 border-b bg-slate-50">
                    <DialogTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <span>{format(date, "M月d日 (E)", { locale: ja })}</span>
                        <span className="text-sm font-normal text-slate-500 bg-white px-2 py-0.5 rounded-full border">
                            {tasks.length}件
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
                    {tasks.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            タスクはありません
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <div
                                key={task.id}
                                onClick={() => onTaskClick(task)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border bg-white hover:bg-slate-50 hover:border-blue-200 transition-all cursor-pointer border-l-4",
                                    statusColor(task.status)
                                )}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-slate-900 truncate">
                                            {task.title}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", priorityColor(task.priority))}>
                                            {priorityLabel(task.priority)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex -space-x-1.5 shrink-0">
                                    {task.assignments?.slice(0, 3).map((a) => (
                                        <Avatar key={a.user_id} className="h-6 w-6 border border-white">
                                            <AvatarImage src={a.user?.avatar_url || ""} />
                                            <AvatarFallback className="text-[8px]">{a.user?.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t bg-slate-50">
                    <Button onClick={onAddTask} className="w-full gap-2" variant="outline">
                        <Plus className="h-4 w-4" />
                        タスクを追加
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
