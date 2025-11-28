"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isToday, isThisWeek, parseISO, isPast, isTomorrow, addDays, isWithinInterval, endOfWeek } from "date-fns";
import { ja } from "date-fns/locale";
import { CheckCircle2, Circle, Clock, AlertCircle, CalendarDays, ArrowRight } from "lucide-react";
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
    settings?: any;
}

export function MyTasks({ tasks, members, currentUserId, settings }: MyTasksProps) {
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

    const weekTasks = myTasks.filter(task => {
        if (!task.due_date) return false;
        const date = parseISO(task.due_date);
        // Tomorrow onwards, up to the end of this week (or next 7 days logic if preferred, but user said "Week")
        // User requirement: "Week: 期限が「明日」以降、「今週末（または向こう7日間）」までのタスク。"
        // Let's use "Tomorrow until End of Week" as a strict interpretation of "Week", 
        // but often "This Week" implies the current week view. 
        // Let's stick to isThisWeek but exclude today/past.
        return isThisWeek(date, { weekStartsOn: 1 }) && !isToday(date) && !isPast(date);
    });

    const handleToggleStatus = async (taskId: string, currentStatus: string) => {
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
            case 'urgent': return 'border-l-red-500';
            case 'high': return 'border-l-orange-500';
            case 'medium': return 'border-l-blue-500';
            case 'low': return 'border-l-slate-400';
            default: return 'border-l-slate-300';
        }
    };

    const getPriorityBadgeColor = (priority: string) => {
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

    const TaskCard = ({ task, isOverdue = false }: { task: Task, isOverdue?: boolean }) => {
        return (
            <Card className={cn(
                "group relative overflow-hidden transition-all duration-200 hover:shadow-md border-slate-200",
                "border-l-4",
                getPriorityColor(task.priority),
                isLoading === task.id && "opacity-70"
            )}>
                <CardContent className="p-3 flex flex-col h-28 justify-between">
                    {/* Top Row: Date & Priority */}
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "px-1.5 py-0.5 rounded border text-[10px]",
                                getPriorityBadgeColor(task.priority)
                            )}>
                                {getPriorityLabel(task.priority)}
                            </span>
                            {task.due_date && (
                                <span className={cn(
                                    "flex items-center gap-1 font-medium",
                                    isOverdue ? "text-red-600" : "text-slate-500"
                                )}>
                                    <Clock className="h-3 w-3" />
                                    {format(parseISO(task.due_date), "M/d(E)", { locale: ja })}
                                </span>
                            )}
                        </div>
                        {isOverdue && (
                            <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-normal gap-1">
                                <AlertCircle className="h-3 w-3" />
                                期限切れ
                            </Badge>
                        )}
                    </div>

                    {/* Middle Row: Title */}
                    <div className="flex-1 mt-2 min-h-0">
                        <h4 className={cn(
                            "font-bold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors",
                            isOverdue && "text-red-700"
                        )}>
                            {task.title}
                        </h4>
                    </div>

                    {/* Bottom Row: Actions */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <button
                            disabled={isLoading === task.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(task.id, task.status);
                            }}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
                        >
                            {isLoading === task.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                            ) : (
                                <Circle className="h-4 w-4" />
                            )}
                            <span>完了にする</span>
                        </button>

                        <TaskDialog
                            members={members}
                            task={task}
                            trigger={
                                <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors">
                                    詳細
                                    <ArrowRight className="h-3 w-3" />
                                </button>
                            }
                            settings={settings}
                        />
                    </div>
                </CardContent>
            </Card>
        );
    };

    const EmptyState = ({ message }: { message: string }) => (
        <div className="flex flex-col items-center justify-center h-40 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50 col-span-full">
            <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">{message}</p>
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            <Tabs defaultValue="today" className="w-full h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-slate-500" />
                        My Tasks
                    </h2>
                    <TabsList className="grid w-[240px] grid-cols-2">
                        <TabsTrigger value="today">
                            今日やる
                            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600 group-data-[state=active]:bg-blue-100 group-data-[state=active]:text-blue-600">
                                {todayTasks.length}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="week">
                            今週の予定
                            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600 group-data-[state=active]:bg-indigo-100 group-data-[state=active]:text-indigo-600">
                                {weekTasks.length}
                            </span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 min-h-0">
                    <TabsContent value="today" className="h-full mt-0">
                        <ScrollArea className="h-full pr-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                                {todayTasks.length === 0 ? (
                                    <EmptyState message="今日のタスクはありません" />
                                ) : (
                                    todayTasks.map(task => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            isOverdue={task.due_date ? isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) : false}
                                        />
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="week" className="h-full mt-0">
                        <ScrollArea className="h-full pr-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                                {weekTasks.length === 0 ? (
                                    <EmptyState message="今週の予定はありません" />
                                ) : (
                                    weekTasks.map(task => (
                                        <TaskCard key={task.id} task={task} />
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
