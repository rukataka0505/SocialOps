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

    // Day List Dialog State
    const [isDayListOpen, setIsDayListOpen] = useState(false);
    const [selectedDateForList, setSelectedDateForList] = useState<Date>(new Date());
    const [selectedDateTasks, setSelectedDateTasks] = useState<any[]>([]);

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

    // Initialize local events (Smart Stack) from props
    useEffect(() => {
        let filteredTasks = tasks;

        // Filter by view mode
        if (viewMode === 'my') {
            filteredTasks = tasks.filter(task =>
                task.assignments?.some((a: any) => a.user_id === currentUserId) ||
                task.assigned_to === currentUserId
            );
        }

        // Group by date
        const eventsMap: Record<string, { date: Date; tasks: any[] }> = {};

        filteredTasks.forEach(task => {
            if (!task.due_date) return;
            const dateStr = format(parse(task.due_date, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd');

            if (!eventsMap[dateStr]) {
                eventsMap[dateStr] = {
                    date: parse(task.due_date, 'yyyy-MM-dd', new Date()),
                    tasks: []
                };
            }
            eventsMap[dateStr].tasks.push(task);
        });

        const events = Object.values(eventsMap).map(item => ({
            start: item.date,
            end: endOfDay(item.date),
            allDay: true,
            resource: {
                tasks: item.tasks,
                count: item.tasks.length
            },
        }));

        setLocalEvents(events);
    }, [tasks, viewMode, currentUserId]);

    const handleSelectEvent = useCallback((event: any) => {
        // Open Day List Dialog
        setSelectedDateForList(event.resource.tasks[0] ? parse(event.resource.tasks[0].due_date, 'yyyy-MM-dd', new Date()) : event.start);
        setSelectedDateTasks(event.resource.tasks);
        setIsDayListOpen(true);
    }, []);

    const handleSelectSlot = useCallback((slotInfo: { start: Date }) => {
        const dateStr = format(slotInfo.start, 'yyyy-MM-dd');
        const tasksForDay = tasks.filter(t => t.due_date === dateStr);

        // Apply view filter
        let filtered = tasksForDay;
        if (viewMode === 'my') {
            filtered = tasksForDay.filter(task =>
                task.assignments?.some((a: any) => a.user_id === currentUserId) ||
                task.assigned_to === currentUserId
            );
        }

        setSelectedDateForList(slotInfo.start);
        setSelectedDateTasks(filtered);
        setIsDayListOpen(true);
    }, [tasks, viewMode, currentUserId]);

    const onEventDrop = useCallback(
        async ({ event, start, end, isAllDay }: any) => {
            // Disable dragging for smart stack view
            return;
        },
        []
    );

    // Navigation handlers
    const goToBack = () => {
        const newDate = new Date(date);
        if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
        else newDate.setDate(newDate.getDate() - 7);
        setDate(newDate);
    };

    const goToNext = () => {
        const newDate = new Date(date);
        if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
        else newDate.setDate(newDate.getDate() + 7);
        setDate(newDate);
    };

    const goToToday = () => {
        setDate(new Date());
    };

    const getLabel = () => {
        if (view === 'month') {
            return format(date, "yyyy年 M月", { locale: ja });
        }
        const start = startOfWeek(date, { locale: ja });
        return `${format(start, "M月d日", { locale: ja })}〜`;
    };

    const handleDrillDown = useCallback((drillDate: Date) => {
        // Disable default drilldown, we want to open the dialog or just stay on month view unless tab is clicked
        // But the requirement says "Clicking date cell... opens DayTaskListDialog" which is handled by onSelectSlot
        // So we can just do nothing here or ensure it doesn't switch view automatically
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

    const components = {
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
    };

    const handleAddTask = () => {
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
    };

    return (
        <div className="h-full w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
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
                        tasks={tasks}
                        currentDate={date}
                        onTaskClick={(task) => {
                            setSelectedTask(task);
                            setIsDialogOpen(true);
                        }}
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
