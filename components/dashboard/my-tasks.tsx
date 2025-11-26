"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isToday, isThisWeek, parseISO, isPast, isTomorrow } from "date-fns";
import { ja } from "date-fns/locale";
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { useState } from "react";
import { toggleTaskStatus } from "@/actions/tasks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Task {
    id: string;
    title: string;
    due_date: string | null;
    priority: string;
    status: string;
    client_id: string | null;
    attributes: any;
    assignments: {
        user_id: string;
        role: string;
        user: {
            id: string;
            name: string;
            avatar_url: string | null;
        } | null;
    }[];
}

interface MyTasksProps {
    tasks: Task[];
    members: any[];
    currentUserId: string;
}

export function MyTasks({ tasks, members, currentUserId }: MyTasksProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    // Filter tasks for the current user
    const myTasks = tasks.filter(task =>
        task.assignments.some(a => a.user_id === currentUserId) &&
        task.status !== 'completed'
    );

    const todayTasks = myTasks.filter(task => {
        if (!task.due_date) return false;
        const date = parseISO(task.due_date);
        return isToday(date) || (isPast(date) && !isToday(date));
    });

    const thisWeekTasks = myTasks.filter(task => {
        if (!task.due_date) return false;
        const date = parseISO(task.due_date);
        // Exclude today/overdue tasks to avoid duplication
        return isThisWeek(date, { weekStartsOn: 1 }) && !isToday(date) && !isPast(date);
    });

    const handleToggleStatus = async (taskId: string, currentStatus: string) => {
        // If currently incomplete (pending/in_progress), ask for confirmation before completing
        if (currentStatus !== 'completed') {
            if (!window.confirm("このタスクを完了にしますか？")) {
                return;
            }
        }

        setIsLoading(taskId);
        try {
            const newStatus = currentStatus === 'completed' ? false : true;
            const result = await toggleTaskStatus(taskId, newStatus);

            if (result.success) {
                toast.success("タスクの状態を更新しました");
                router.refresh();
            } else {
                toast.error("更新に失敗しました");
            }
        } catch (error) {
            toast.error("エラーが発生しました");
        } finally {
            setIsLoading(null);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'low': return 'text-slate-600 bg-slate-50 border-slate-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'urgent': return '緊急';
            case 'high': return '高';
            case 'medium': return '中';
            case 'low': return '低';
            default: return priority;
        }
    };

    const TaskItem = ({ task, isOverdue = false }: { task: Task, isOverdue?: boolean }) => (
        <div className="group flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all duration-200">
            <button
                disabled={isLoading === task.id}
                onClick={() => handleToggleStatus(task.id, task.status)}
                className="shrink-0 text-slate-300 hover:text-blue-600 transition-colors"
            >
                {isLoading === task.id ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                ) : (
                    <Circle className="h-5 w-5" />
                )}
            </button>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                        "text-sm font-medium truncate",
                        isOverdue ? "text-red-600" : "text-slate-900"
                    )}>
                        {task.title}
                    </span>
                    {isOverdue && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal text-red-600 bg-red-50 border-red-200 gap-1">
                            <AlertCircle className="h-3 w-3" />
                            期限切れ
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className={cn(
                        "px-1.5 py-0.5 rounded border text-[10px]",
                        getPriorityColor(task.priority)
                    )}>
                        {getPriorityLabel(task.priority)}
                    </span>
                    {task.due_date && (
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(task.due_date), "M/d(E)", { locale: ja })}
                        </span>
                    )}
                </div>
            </div>

            <TaskDialog
                members={members}
                task={task}
                trigger={
                    <button className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-all">
                        詳細
                    </button>
                }
            />
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Today's Tasks */}
            <Card className="border-none shadow-none bg-transparent flex flex-col h-full">
                <CardHeader className="px-0 py-3">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs">
                            {todayTasks.length}
                        </span>
                        今日が期限のタスク
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 flex-1 min-h-0">
                    <ScrollArea className="h-full pr-4">
                        <div className="space-y-2">
                            {todayTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50">
                                    <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                                    <p className="text-sm">今日のタスクはありません</p>
                                </div>
                            ) : (
                                todayTasks.map(task => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        isOverdue={task.due_date ? isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) : false}
                                    />
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* This Week's Tasks */}
            <Card className="border-none shadow-none bg-transparent flex flex-col h-full">
                <CardHeader className="px-0 py-3">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs">
                            {thisWeekTasks.length}
                        </span>
                        今週の予定
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 flex-1 min-h-0">
                    <ScrollArea className="h-full pr-4">
                        <div className="space-y-2">
                            {thisWeekTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50">
                                    <p className="text-sm">今週の残りのタスクはありません</p>
                                </div>
                            ) : (
                                thisWeekTasks.map(task => (
                                    <TaskItem key={task.id} task={task} />
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
