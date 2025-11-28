"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parse, startOfWeek, getDay, endOfDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar, dateFnsLocalizer, Views, View } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { updateTask } from "@/actions/tasks";
import { useRouter } from "next/navigation";


const locales = {
    "ja": ja,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

interface CalendarBoardProps {
    tasks: any[];
    members: any[];
    currentUserId: string;
    settings?: any;
}

export function CalendarBoard({ tasks, members, currentUserId, settings }: CalendarBoardProps) {
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [localEvents, setLocalEvents] = useState<any[]>([]);
    const [isMobile, setIsMobile] = useState(false);
    const [viewMode, setViewMode] = useState<'my' | 'all'>('my');
    const router = useRouter();

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Initialize local events from props
    useEffect(() => {
        let filteredTasks = tasks;

        // Filter by view mode
        if (viewMode === 'my') {
            filteredTasks = tasks.filter(task =>
                task.assignments?.some((a: any) => a.user_id === currentUserId) ||
                task.assigned_to === currentUserId
            );
        }

        const events = filteredTasks.map(task => ({
            id: task.id,
            title: task.title,
            start: new Date(task.due_date),
            end: endOfDay(new Date(task.due_date)),
            allDay: true,
            resource: task,
        }));
        setLocalEvents(events);
    }, [tasks, viewMode, currentUserId]);

    const handleSelectEvent = useCallback((event: any) => {
        setSelectedTask(event.resource);
        setIsDialogOpen(true);
    }, []);

    const onEventDrop = useCallback(
        async ({ event, start, end, isAllDay }: any) => {
            const formattedDate = format(start, "yyyy年M月d日", { locale: ja });
            const confirmed = window.confirm(`「${event.title}」を ${formattedDate} に移動しますか?`);

            if (!confirmed) return;

            const updatedEvent = { ...event, start, end, allDay: true };

            // Optimistic update
            setLocalEvents((prev) => {
                const filtered = prev.filter((e) => e.id !== event.id);
                return [...filtered, updatedEvent];
            });

            try {
                const newDueDate = format(start, "yyyy-MM-dd");
                const result = await updateTask(event.id, { due_date: newDueDate });

                if (!result.success) {
                    throw new Error("Failed to update task");
                }

                router.refresh();
            } catch (error) {
                console.error("DnD Update Error:", error);
                // Revert on error
                setLocalEvents((prev) => {
                    const filtered = prev.filter((e) => e.id !== event.id);
                    return [...filtered, event];
                });
                alert("タスクの移動に失敗しました。");
            }
        },
        [router]
    );

    // Navigation handlers
    const goToBack = () => {
        const newDate = new Date(date);
        if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
        else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
        else newDate.setDate(newDate.getDate() - 1);
        setDate(newDate);
    };

    const goToNext = () => {
        const newDate = new Date(date);
        if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
        else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
        else newDate.setDate(newDate.getDate() + 1);
        setDate(newDate);
    };

    const goToToday = () => {
        setDate(new Date());
    };

    const getLabel = () => {
        if (view === 'month') {
            return format(date, "yyyy年 M月", { locale: ja });
        }
        if (view === 'day') {
            return format(date, "yyyy年 M月 d日 (E)", { locale: ja });
        }
        const start = startOfWeek(date, { locale: ja });
        return `${format(start, "M月d日", { locale: ja })}〜`;
    };

    const eventPropGetter = useCallback(
        (event: any, start: Date, end: Date, isSelected: boolean) => {
            const statusColors: Record<string, string> = {
                in_progress: "#3b82f6", // blue-500
                pending: "#f59e0b",     // amber-500
                completed: "#94a3b8",   // slate-400
                cancelled: "#cbd5e1",   // slate-300
            };

            const status = event.resource.status || "in_progress";
            const backgroundColor = statusColors[status] || "#3b82f6";

            // Check if task is assigned to current user
            const assignments = event.resource.assignments || [];
            const isAssignedToMe = assignments.some((a: any) => a.user_id === currentUserId) || event.resource.assigned_to === currentUserId;

            const style: React.CSSProperties = {
                backgroundColor,
                borderRadius: "6px",
                opacity: 0.95,
                color: "white",
                border: "0px",
                display: "block",
                padding: "2px 4px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            };

            if (isAssignedToMe) {
                style.borderLeft = "3px solid #1e3a8a"; // blue-900
                style.fontWeight = "600";
            }

            return {
                style,
            };
        },
        [currentUserId]
    );

    const components = {
        event: ({ event }: any) => {
            const task = event.resource;
            const assignments = task.assignments || [];
            const assignee = task.assignee;

            return (
                <div className="flex items-center gap-1 overflow-hidden px-1 h-full w-full cursor-pointer">
                    <div className="flex -space-x-1 overflow-hidden shrink-0">
                        {assignments.length > 0 ? (
                            assignments.map((assignment: any) => (
                                <Avatar key={assignment.user_id} className="h-3 w-3 md:h-4 md:w-4 border border-white ring-1 ring-background">
                                    <AvatarImage src={assignment.user?.avatar_url || ""} />
                                    <AvatarFallback className="text-[4px] md:text-[6px]">{assignment.user?.name?.[0] || "?"}</AvatarFallback>
                                </Avatar>
                            ))
                        ) : assignee ? (
                            <Avatar className="h-3 w-3 md:h-4 md:w-4 border border-white">
                                <AvatarImage src={assignee.avatar_url || ""} />
                                <AvatarFallback className="text-[6px] md:text-[8px]">{assignee.name?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                        ) : null}
                    </div>
                    <span className="truncate font-medium text-[10px] md:text-xs lg:text-sm leading-tight">{event.title}</span>
                </div>
            );
        },
        month: {
            dateHeader: ({ label }: any) => (
                <span className="text-xs md:text-sm lg:text-base font-medium text-slate-700">
                    {label}
                </span>
            ),
        },
        toolbar: () => null,
    };

    return (
        <div className="h-full w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            {/* Unified Header Toolbar */}
            <div className="flex items-center justify-between mb-4">
                {/* Left: View Mode Toggle */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('my')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'my'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        📅 自分のタスク
                    </button>
                    <button
                        onClick={() => setViewMode('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'all'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        👥 チーム全体
                    </button>
                </div>

                {/* Center: Date Navigation */}
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        今日
                    </Button>
                    <div className="flex items-center bg-slate-50 rounded-md border border-slate-200 p-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToBack}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-bold px-3 min-w-[120px] text-center">
                            {getLabel()}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNext}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Right: View Switcher */}
                <div className="flex items-center gap-2">
                    <Select value={view} onValueChange={(v: any) => setView(v)}>
                        <SelectTrigger className="h-8 w-[100px]">
                            <SelectValue placeholder="表示切替" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="month">月</SelectItem>
                            <SelectItem value="week">週</SelectItem>
                            <SelectItem value="day">日</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <DnDCalendar
                localizer={localizer}
                events={localEvents}
                startAccessor={(event: any) => event.start}
                endAccessor={(event: any) => event.end}
                style={{ height: "100%" }}
                views={['month', 'week', 'day']}
                view={view}
                date={date}
                onView={setView}
                onNavigate={setDate}
                culture="ja"
                onSelectEvent={handleSelectEvent}
                onEventDrop={onEventDrop}
                draggableAccessor={() => !isMobile}
                resizable={false}
                eventPropGetter={eventPropGetter}
                components={components}
                messages={{
                    next: "次へ",
                    previous: "前へ",
                    today: "今日",
                    month: "月",
                    week: "週",
                    day: "日",
                    agenda: "予定",
                    date: "日付",
                    time: "時間",
                    event: "イベント",
                    noEventsInRange: "この期間にイベントはありません。",
                }}
                className="modern-calendar"
            />

            {selectedTask && (
                <TaskDialog
                    members={members}
                    task={selectedTask}
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    settings={settings}
                />
            )}
        </div>
    );
}
