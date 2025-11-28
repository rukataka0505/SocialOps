"use client";

import { useState, useEffect, useTransition } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSaturday, isSunday, getDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Loader2, Calendar as CalendarIcon, User } from "lucide-react";
import { getClientMilestones } from "@/actions/tasks";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MonthlyListScheduleProps {
    clientId: string;
    members: any[]; // Team members for TaskDialog
    settings?: any; // Team settings for TaskDialog
}

export function MonthlyListSchedule({ clientId, members, settings }: MonthlyListScheduleProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [milestones, setMilestones] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();

    const fetchMilestones = () => {
        setIsLoading(true);
        startTransition(async () => {
            try {
                const start = startOfMonth(currentMonth);
                const end = endOfMonth(currentMonth);
                const data = await getClientMilestones(clientId, start, end);
                setMilestones(data);
            } finally {
                setIsLoading(false);
            }
        });
    };

    useEffect(() => {
        fetchMilestones();
    }, [currentMonth, clientId]);

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const getTasksForDay = (date: Date) => {
        return milestones.filter(task => isSameDay(new Date(task.due_date), date));
    };

    const getDayColor = (date: Date) => {
        if (isSaturday(date)) return "bg-blue-50/50 hover:bg-blue-50";
        if (isSunday(date)) return "bg-red-50/50 hover:bg-red-50";
        return "hover:bg-gray-50";
    };

    const getDayLabelColor = (date: Date) => {
        if (isSaturday(date)) return "text-blue-600";
        if (isSunday(date)) return "text-red-600";
        return "text-gray-900";
    };

    const statusMap: Record<string, { label: string, color: string, borderColor: string }> = {
        'in_progress': { label: '進行中', color: 'bg-blue-50 text-blue-700', borderColor: 'border-blue-200' },
        'pending': { label: '確認待ち', color: 'bg-yellow-50 text-yellow-700', borderColor: 'border-yellow-200' },
        'completed': { label: '完了', color: 'bg-green-50 text-green-700', borderColor: 'border-green-200' },
        'not_started': { label: '未着手', color: 'bg-gray-50 text-gray-700', borderColor: 'border-gray-200' },
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold">
                        {format(currentMonth, "yyyy年 M月", { locale: ja })}
                    </h3>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleNextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <Button variant="outline" onClick={fetchMilestones} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "更新"}
                </Button>
            </div>

            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="grid grid-cols-[80px_1fr_80px] bg-gray-100 border-b text-sm font-medium text-gray-500 py-2 px-4">
                    <div>日付</div>
                    <div>投稿予定 (親タスク)</div>
                    <div className="text-right">操作</div>
                </div>
                <ScrollArea className="h-[600px] min-h-[600px]">
                    <div className="divide-y">
                        {days.map((date) => {
                            const dayTasks = getTasksForDay(date);
                            const dayColor = getDayColor(date);
                            const dayLabelColor = getDayLabelColor(date);
                            const formattedDate = format(date, "d日 (E)", { locale: ja });

                            return (
                                <div key={date.toISOString()} className={cn("grid grid-cols-[80px_1fr_80px] items-start py-3 px-4 transition-colors min-h-[80px]", dayColor)}>
                                    <div className={cn("text-sm font-medium pt-2", dayLabelColor)}>
                                        {formattedDate}
                                    </div>

                                    <div className="space-y-2 pr-4">
                                        {dayTasks.length > 0 ? (
                                            dayTasks.map(task => {
                                                const status = task.workflow_status || task.status;
                                                const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-50 text-gray-700', borderColor: 'border-gray-200' };

                                                // Find assignee (first one for display)
                                                const assignee = task.assignments?.[0]?.user;

                                                return (
                                                    <TaskDialog
                                                        key={task.id}
                                                        members={members}
                                                        settings={settings}
                                                        task={task}
                                                        onOpenChange={(open) => !open && fetchMilestones()}
                                                        trigger={
                                                            <div className={cn(
                                                                "group flex items-center justify-between p-3 rounded-md border cursor-pointer transition-all hover:shadow-md",
                                                                "bg-white hover:border-blue-300",
                                                                statusInfo.borderColor
                                                            )}>
                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                    <Badge variant="outline" className={cn("shrink-0", statusInfo.color, "border-0")}>
                                                                        {statusInfo.label}
                                                                    </Badge>
                                                                    <span className="font-medium text-sm text-gray-900 group-hover:text-blue-700 transition-colors">
                                                                        {task.title}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-4 shrink-0">
                                                                    {/* Subtasks */}
                                                                    {task.subtasks && task.subtasks.length > 0 && (
                                                                        <div className="flex items-center gap-2 text-xs">
                                                                            {task.subtasks.slice(0, 3).map((subtask: any) => {
                                                                                const subtaskAssignee = subtask.assignments?.[0]?.user;
                                                                                return (
                                                                                    <div key={subtask.id} className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200" title={subtask.title}>
                                                                                        <span className="text-gray-600 max-w-[100px] truncate">{subtask.title}</span>
                                                                                        {subtaskAssignee && (
                                                                                            <Avatar className="h-4 w-4 border">
                                                                                                <AvatarImage src={subtaskAssignee.avatar_url || ""} />
                                                                                                <AvatarFallback className="text-[8px]">{subtaskAssignee.name?.[0] || "?"}</AvatarFallback>
                                                                                            </Avatar>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                            {task.subtasks.length > 3 && (
                                                                                <span className="text-gray-400 text-xs">+{task.subtasks.length - 3}</span>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* Parent Assignee Avatar */}
                                                                    {assignee ? (
                                                                        <div className="flex items-center gap-1.5" title={assignee.name}>
                                                                            <Avatar className="h-6 w-6 border">
                                                                                <AvatarImage src={assignee.avatar_url || ""} />
                                                                                <AvatarFallback className="text-[10px]">{assignee.name?.[0] || "?"}</AvatarFallback>
                                                                            </Avatar>
                                                                            <span className="hidden sm:inline-block max-w-[80px] truncate text-xs text-gray-500">
                                                                                {assignee.name}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1 text-gray-400">
                                                                            <div className="h-6 w-6 rounded-full border border-dashed flex items-center justify-center">
                                                                                <User className="h-3 w-3" />
                                                                            </div>
                                                                            <span className="hidden sm:inline-block text-xs">未定</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        }
                                                    />
                                                );
                                            })
                                        ) : (
                                            <div className="h-full flex items-center">
                                                <span className="text-xs text-gray-400">-</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-right pt-1">
                                        <TaskDialog
                                            members={members}
                                            settings={settings}
                                            trigger={
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-gray-200">
                                                    <Plus className="h-4 w-4 text-gray-500" />
                                                </Button>
                                            }
                                            task={{
                                                client_id: clientId,
                                                due_date: format(date, 'yyyy-MM-dd'),
                                                is_milestone: true,
                                                title: '新規投稿'
                                            }}
                                            onOpenChange={(open) => !open && fetchMilestones()}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
