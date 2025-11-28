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

    // Initialize local events (Summary) from props
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
        const eventsMap: Record<string, { date: Date; counts: Record<string, number>; tasks: any[] }> = {};

        filteredTasks.forEach(task => {
            if (!task.due_date) return;
            const dateStr = format(parse(task.due_date, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd');

            if (!eventsMap[dateStr]) {
                eventsMap[dateStr] = {
                    date: parse(task.due_date, 'yyyy-MM-dd', new Date()),
                    counts: { in_progress: 0, pending: 0, completed: 0, cancelled: 0 },
                    tasks: []
                };
            }

            const status = task.status || 'in_progress';
            if (eventsMap[dateStr].counts[status] !== undefined) {
                eventsMap[dateStr].counts[status]++;
            } else {
                // Fallback for custom statuses if needed, or just map to closest
                eventsMap[dateStr].counts['in_progress']++;
            }
            eventsMap[dateStr].tasks.push(task);
        });

        const events = Object.values(eventsMap).map(item => ({
            start: item.date,
            end: endOfDay(item.date),
            allDay: true,
            resource: item, // Contains counts and tasks
        }));

        setLocalEvents(events);
    }, [tasks, viewMode, currentUserId]);

    const handleSelectEvent = useCallback((event: any) => {
        // Open Day List Dialog
        setSelectedDateForList(event.resource.date);
        setSelectedDateTasks(event.resource.tasks);
        setIsDayListOpen(true);
    }, []);

    const handleSelectSlot = useCallback((slotInfo: { start: Date }) => {
        // Open Day List Dialog for empty slot too
        // We need to find tasks for this date if any (though if it was empty, likely no tasks, but let's be safe)
        // Actually if it's empty slot, tasks are empty.
        // But wait, if we click on a day with events, react-big-calendar might trigger onSelectEvent instead.
        // If we click on empty space in a day with events, it might trigger onSelectSlot.

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
            // Summary events cannot be dragged in this view logic usually, 
            // but if we want to support dragging the *entire day's tasks*, that's complex.
            // For now, let's disable dragging of summary events or handle it if needed.
            // Given the requirement is "Summary View", dragging a summary bubble to move ALL tasks seems dangerous/unexpected.
            // Let's disable dragging for summary view.
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
        // When clicking date header, switch to board view
        setDate(drillDate);
        setView('board');
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
            const counts = event.resource.counts;
            return (
                <div className="flex flex-wrap gap-1 justify-center items-center h-full w-full p-1 cursor-pointer hover:bg-slate-50 rounded-md transition-colors">
                    {counts.in_progress > 0 && (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold border border-blue-200" title="進行中">
                            {counts.in_progress}
                        </div>
                    )}
                    {counts.pending > 0 && (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600 text-xs font-bold border border-amber-200" title="未着手">
                            {counts.pending}
                        </div>
                    )}
                    {counts.completed > 0 && (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200" title="完了">
                            {counts.completed}
                        </div>
                    )}
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

    const handleAddTask = () => {
        // Open TaskDialog with pre-filled date
        // We need to create a dummy task object
        const newTask = {
            title: "",
            due_date: format(selectedDateForList, "yyyy-MM-dd"),
            status: "pending",
            priority: "medium",
            assignments: [],
            // Add other necessary fields
        };
        setSelectedTask(newTask);
        setIsDayListOpen(false); // Close list dialog
        setIsDialogOpen(true); // Open task dialog
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
                    draggableAccessor={() => false} // Disable dragging for summary
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
