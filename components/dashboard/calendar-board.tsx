"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parse, startOfWeek, getDay, endOfDay, startOfMonth, endOfMonth, endOfWeek } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar, dateFnsLocalizer, Views, View } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { updateTask, getTasks } from "@/actions/tasks";
import { useRouter } from "next/navigation";
import { WeeklyBoard } from "./weekly-board";
import { DayTaskListDialog } from "./day-task-list-dialog";


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
    const [view, setView] = useState<'month' | 'board'>('month');
    const [date, setDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Dynamic Data Fetching State
    const [allTasks, setAllTasks] = useState<any[]>(tasks);
    const [isLoading, setIsLoading] = useState(false);

    // Sync props.tasks with allTasks when props change (optional but good for initial load consistency)
    useEffect(() => {
        setAllTasks(prev => {
            const taskMap = new Map(prev.map(t => [t.id, t]));
            tasks.forEach(t => taskMap.set(t.id, t));
            return Array.from(taskMap.values());
        });
    }, [tasks]);

    // Fetch tasks when date or view changes
    useEffect(() => {
        const fetchTasks = async () => {
            setIsLoading(true);
            try {
                let start: Date, end: Date;
                if (view === 'month') {
                    // Fetch for the entire month view (including padding days)
                    start = startOfWeek(startOfMonth(date), { locale: ja });
                    end = endOfWeek(endOfMonth(date), { locale: ja });
                } else {
                    // Fetch for the week view
                    start = startOfWeek(date, { locale: ja });
                    end = endOfWeek(date, { locale: ja });
                }

                const startStr = format(start, 'yyyy-MM-dd');
                const endStr = format(end, 'yyyy-MM-dd');

                const newTasks = await getTasks(startStr, endStr);

                setAllTasks(prev => {
                    const taskMap = new Map(prev.map(t => [t.id, t]));
                    // Merge new tasks (overwrite existing ones to ensure latest status)
                    newTasks.forEach((t: any) => taskMap.set(t.id, t));
                    return Array.from(taskMap.values());
                });
            } catch (error) {
                console.error("Failed to fetch tasks", error);
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce could be added here if needed, but for now direct call
        // We use a transition or just async call. 
        // Since getTasks is a server action, it's async.

        // Check if we already have tasks for this range? 
        // For simplicity and data freshness, we fetch every time for now.
        fetchTasks();
    }, [date, view]);

    // Day List Dialog State
    const [isDayListOpen, setIsDayListOpen] = useState(false);
    const [selectedDateForList, setSelectedDateForList] = useState<Date>(new Date());
    const [selectedDateTasks, setSelectedDateTasks] = useState<any[]>([]);

    const [isMobile, setIsMobile] = useState(false);
    const [viewMode, setViewMode] = useState<'my' | 'all'>('my');
    const router = useRouter();

    // Detect mobile device with debounce
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
        };

        // Initial check
        checkMobile();

        let timeoutId: NodeJS.Timeout;
        const debouncedCheckMobile = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(checkMobile, 200);
        };

        window.addEventListener('resize', debouncedCheckMobile);

        return () => {
            window.removeEventListener('resize', debouncedCheckMobile);
            clearTimeout(timeoutId);
        };
    }, []);

    // Initialize local events (Smart Stack) from props - Memoized
    const localEvents = useMemo(() => {
        let filteredTasks = allTasks;

        // Filter by view mode
        if (viewMode === 'my') {
            // My View: Assigned to me OR (Private AND Created by me)
            filteredTasks = tasks.filter(task =>
                task.assignments?.some((a: any) => a.user_id === currentUserId) ||
                (task.is_private && task.created_by === currentUserId)
            );
        } else {
            // Team View: Exclude private tasks
            filteredTasks = tasks.filter(task => !task.is_private);
        }

        // Group by date
        const eventsMap: Record<string, { date: Date; tasks: any[] }> = {};

        filteredTasks.forEach(task => {
            if (!task.due_date) return;

            const date = new Date(task.due_date);
            if (isNaN(date.getTime())) return;

            const dateStr = format(date, 'yyyy-MM-dd');

            if (!eventsMap[dateStr]) {
                eventsMap[dateStr] = {
                    date: date,
                    tasks: []
                };
            }
            eventsMap[dateStr].tasks.push(task);
        });

        return Object.values(eventsMap).map(item => ({
            start: item.date,
            end: endOfDay(item.date),
            allDay: true,
            resource: {
                tasks: item.tasks,
                count: item.tasks.length
            },
        }));
    }, [allTasks, viewMode, currentUserId]);

    const handleSelectEvent = useCallback((event: any) => {
        // Open Day List Dialog
        setSelectedDateForList(event.resource.tasks[0] ? new Date(event.resource.tasks[0].due_date) : event.start);
        setSelectedDateTasks(event.resource.tasks);
        setIsDayListOpen(true);
    }, []);

    const handleSelectSlot = useCallback((slotInfo: { start: Date }) => {
        const dateStr = format(slotInfo.start, 'yyyy-MM-dd');
        const tasksForDay = allTasks.filter(t => t.due_date === dateStr);

        // Apply view filter
        let filtered = tasksForDay;
        if (viewMode === 'my') {
            filtered = tasksForDay.filter(task =>
                task.assignments?.some((a: any) => a.user_id === currentUserId) ||
                (task.is_private && task.created_by === currentUserId)
            );
        } else {
            filtered = tasksForDay.filter(task => !task.is_private);
        }

        setSelectedDateForList(slotInfo.start);
        setSelectedDateTasks(filtered);
        setIsDayListOpen(true);
    }, [allTasks, viewMode, currentUserId]);

    const onEventDrop = useCallback(
        async ({ event, start, end, isAllDay }: any) => {
            // Disable dragging for smart stack view
            return;
        },
        []
    );

    // Navigation handlers
    const goToBack = useCallback(() => {
        setDate(prev => {
            const newDate = new Date(prev);
            if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
            else newDate.setDate(newDate.getDate() - 7);
            return newDate;
        });
    }, [view]);

    const goToNext = useCallback(() => {
        setDate(prev => {
            const newDate = new Date(prev);
            if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
            else newDate.setDate(newDate.getDate() + 7);
            return newDate;
        });
    }, [view]);

    const goToToday = useCallback(() => {
        setDate(new Date());
    }, []);

    const getLabel = useCallback(() => {
        if (view === 'month') {
            return format(date, "yyyy年 M月", { locale: ja });
        }
        const start = startOfWeek(date, { locale: ja });
        return `${format(start, "M月d日", { locale: ja })}〜`;
    }, [view, date]);

    const handleDrillDown = useCallback((drillDate: Date) => {
        return;
    }, []);

    const eventPropGetter = useCallback(
        (event: any, start: Date, end: Date, isSelected: boolean) => {
            return {
                style: {
                    backgroundColor: 'transparent',
                    padding: 0,
                    border: 'none',
                },
            };
        },
        []
    );

    const components = useMemo(() => ({
        event: ({ event }: any) => {
            const { tasks, count } = event.resource;
            const MAX_VISIBLE = 3;

            const statusColors: Record<string, string> = {
                in_progress: "bg-blue-500",
                pending: "bg-amber-500",
                completed: "bg-slate-400",
                cancelled: "bg-slate-300",
            };

            if (count <= MAX_VISIBLE) {
                return (
                    <div className="flex flex-col gap-1 w-full">
                        {tasks.map((task: any) => (
                            <div key={task.id} className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1 py-0.5 shadow-sm overflow-hidden">
                                <div className={`w-1 h-3 rounded-full shrink-0 ${statusColors[task.status] || "bg-blue-500"}`} />
                                <span className="text-[10px] text-slate-700 truncate font-medium leading-tight">
                                    {task.title}
                                </span>
                            </div>
                        ))}
                    </div>
                );
            } else {
                const visibleTasks = tasks.slice(0, 2);
                const remaining = count - 2;
                return (
                    <div className="flex flex-col gap-1 w-full">
                        {visibleTasks.map((task: any) => (
                            <div key={task.id} className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1 py-0.5 shadow-sm overflow-hidden">
                                <div className={`w-1 h-3 rounded-full shrink-0 ${statusColors[task.status] || "bg-blue-500"}`} />
                                <span className="text-[10px] text-slate-700 truncate font-medium leading-tight">
                                    {task.title}
                                </span>
                            </div>
                        ))}
                        <div className="bg-slate-100 text-slate-600 text-[10px] font-bold text-center rounded py-0.5 border border-slate-200 hover:bg-slate-200 transition-colors">
                            + 他 {remaining} 件
                        </div>
                    </div>
                );
            }
        },
        month: {
            dateHeader: ({ label }: any) => (
                <span className="text-xs md:text-sm lg:text-base font-medium text-slate-700 block p-1">
                    {label}
                </span>
            ),
        },
        toolbar: () => null,
    }), []);

    const handleAddTask = useCallback(() => {
        const newTask = {
            title: "",
            due_date: format(selectedDateForList, "yyyy-MM-dd"),
            status: "pending",
            priority: "medium",
            assignments: [],
        };
        setSelectedTask(newTask);
        setIsDayListOpen(false);
        setIsDialogOpen(true);
    }, [selectedDateForList]);

    const handleTaskClick = useCallback((task: any) => {
        setSelectedTask(task);
        setIsDialogOpen(true);
    }, []);

    return (
        <div className="w-full aspect-[16/11] min-h-[700px] max-h-[900px] bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
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
                        {isLoading && (
                            <div className="absolute right-[-24px] top-1/2 -translate-y-1/2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: View Switcher (Tabs) */}
                <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setView('month')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'month'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        月 (Month)
                    </button>
                    <button
                        onClick={() => setView('board')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'board'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        週 (Board)
                    </button>
                </div>
            </div>

            {view === 'board' ? (
                <div className="flex-1 overflow-hidden min-h-0">
                    <WeeklyBoard
                        tasks={allTasks}
                        currentDate={date}
                        onTaskClick={handleTaskClick}
                    />
                </div>
            ) : (
                <DnDCalendar
                    localizer={localizer}
                    events={localEvents}
                    startAccessor={(event: any) => event.start}
                    endAccessor={(event: any) => event.end}
                    style={{ height: "100%" }}
                    views={['month']}
                    view={Views.MONTH}
                    date={date}
                    onNavigate={setDate}
                    onDrillDown={handleDrillDown}
                    onSelectSlot={handleSelectSlot}
                    selectable={true}
                    culture="ja"
                    onSelectEvent={handleSelectEvent}
                    onEventDrop={onEventDrop}
                    draggableAccessor={() => false} // Disable dragging for smart stack
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
                        showMore: (total) => `他 ${total} 件`,
                    }}
                    className="modern-calendar"
                />
            )}

            {/* Task Detail Dialog */}
            {selectedTask && (
                <TaskDialog
                    members={members}
                    task={selectedTask}
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    settings={settings}
                    defaultScope={viewMode === 'my' ? 'private' : 'team'}
                />
            )}

            {/* Day Task List Dialog */}
            <DayTaskListDialog
                isOpen={isDayListOpen}
                onClose={() => setIsDayListOpen(false)}
                date={selectedDateForList}
                tasks={selectedDateTasks}
                onTaskClick={(task) => {
                    setSelectedTask(task);
                    setIsDayListOpen(false);
                    setIsDialogOpen(true);
                }}
                onAddTask={handleAddTask}
            />
        </div>
    );
}
