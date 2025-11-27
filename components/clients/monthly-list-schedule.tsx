"use client";

import { useState, useEffect, useTransition } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSaturday, isSunday, getDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { getClientMilestones } from "@/actions/tasks";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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

    const statusMap: Record<string, { label: string, color: string }> = {
        'in_progress': { label: '進行中', color: 'bg-blue-100 text-blue-800' },
        'pending': { label: '確認待ち', color: 'bg-yellow-100 text-yellow-800' },
        'completed': { label: '完了', color: 'bg-green-100 text-green-800' },
        'not_started': { label: '未着手', color: 'bg-gray-100 text-gray-800' },
    };

    // Custom statuses from settings
    if (settings?.workflow_statuses) {
        // This is a simplified mapping, ideally we'd match exact strings or have a color map
        // For now, we'll just use the default map or a generic one
    }

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
                <div className="grid grid-cols-[80px_1fr_100px_80px] bg-gray-100 border-b text-sm font-medium text-gray-500 py-2 px-4">
                    <div>日付</div>
                    <div>投稿予定 (親タスク)</div>
                    <div>ステータス</div>
                    <div className="text-right">操作</div>
                </div>
                <ScrollArea className="h-[600px]">
                    <div className="divide-y">
                        {days.map((date) => {
                            const dayTasks = getTasksForDay(date);
                            const dayColor = getDayColor(date);
                            const dayLabelColor = getDayLabelColor(date);
                            const formattedDate = format(date, "d日 (E)", { locale: ja });

                            return (
                                <div key={date.toISOString()} className={cn("grid grid-cols-[80px_1fr_100px_80px] items-center py-3 px-4 transition-colors", dayColor)}>
                                    <div className={cn("text-sm font-medium", dayLabelColor)}>
                                        {formattedDate}
                                    </div>

                                    <div className="space-y-2">
                                        {dayTasks.length > 0 ? (
                                            dayTasks.map(task => (
                                                <div key={task.id} className="flex items-center gap-2">
                                                    <TaskDialog
                                                        members={members}
                                                        settings={settings}
                                                        task={task}
                                                        trigger={
                                                            <button className="text-left hover:underline font-medium text-sm truncate max-w-[300px]">
                                                                {task.title}
                                                            </button>
                                                        }
                                                        onOpenChange={(open) => !open && fetchMilestones()}
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400">-</span>
                                        )}
                                    </div>

                                    <div>
                                        {dayTasks.map(task => {
                                            const status = task.workflow_status || task.status;
                                            const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
                                            return (
                                                <Badge key={task.id} variant="outline" className={cn("mb-1 block w-fit", statusInfo.color)}>
                                                    {statusInfo.label}
                                                </Badge>
                                            );
                                        })}
                                    </div>

                                    <div className="text-right">
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
