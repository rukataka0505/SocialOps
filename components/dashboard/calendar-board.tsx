"use client";

import { useState, useCallback, useEffect } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ja } from "date-fns/locale";
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
}

export function CalendarBoard({ tasks, members }: CalendarBoardProps) {
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [localEvents, setLocalEvents] = useState<any[]>([]);
    const router = useRouter();

    // Initialize local events from props
    useEffect(() => {
        const events = tasks.map(task => ({
            id: task.id,
            title: task.title,
            start: new Date(task.due_date),
            end: new Date(task.due_date),
            allDay: true,
            resource: task,
        }));
        setLocalEvents(events);
    }, [tasks]);

    const handleSelectEvent = useCallback((event: any) => {
        setSelectedTask(event.resource);
        setIsDialogOpen(true);
    }, []);

    const onEventDrop = useCallback(
        async ({ event, start, end, isAllDay }: any) => {
            const updatedEvent = { ...event, start, end, allDay: isAllDay };

            // Optimistic update
            setLocalEvents((prev) => {
                const filtered = prev.filter((e) => e.id !== event.id);
                return [...filtered, updatedEvent];
            });

            try {
                // Format date as YYYY-MM-DD for backend
                // Note: start is a Date object.
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

    const eventPropGetter = useCallback(
        (event: any, start: Date, end: Date, isSelected: boolean) => {
            const priorityColors: Record<string, string> = {
                urgent: "#ef4444", // red-500
                high: "#f97316",   // orange-500
                medium: "#3b82f6", // blue-500
                low: "#10b981",    // emerald-500
            };

            const priority = event.resource.priority || "medium";
            const backgroundColor = priorityColors[priority];

            return {
                style: {
                    backgroundColor,
                    borderRadius: "4px",
                    opacity: 0.9,
                    color: "white",
                    border: "0px",
                    display: "block",
                    fontSize: "0.8rem",
                },
            };
        },
        []
    );

    const components = {
        event: ({ event }: any) => {
            const task = event.resource;
            const assignments = task.assignments || [];
            const assignee = task.assignee;

            return (
                <div className="flex items-center gap-1 overflow-hidden px-1 h-full">
                    <div className="flex -space-x-1 overflow-hidden shrink-0">
                        {assignments.length > 0 ? (
                            assignments.map((assignment: any) => (
                                <Avatar key={assignment.user_id} className="h-4 w-4 border border-white ring-1 ring-background">
                                    <AvatarImage src={assignment.user?.avatar_url || ""} />
                                    <AvatarFallback className="text-[6px]">{assignment.user?.name?.[0] || "?"}</AvatarFallback>
                                </Avatar>
                            ))
                        ) : assignee ? (
                            <Avatar className="h-4 w-4 border border-white">
                                <AvatarImage src={assignee.avatar_url || ""} />
                                <AvatarFallback className="text-[8px]">{assignee.name?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                        ) : null}
                    </div>
                    <span className="truncate font-medium text-xs">{event.title}</span>
                </div>
            );
        },
    };

    return (
        <div className="h-full w-full bg-white p-4 rounded-lg shadow-sm border flex flex-col">
            <DnDCalendar
                localizer={localizer}
                events={localEvents}
                startAccessor={(event: any) => event.start}
                endAccessor={(event: any) => event.end}
                style={{ height: "calc(100vh - 140px)" }}
                views={['month', 'week', 'day']}
                view={view}
                date={date}
                onView={setView}
                onNavigate={setDate}
                culture="ja"
                onSelectEvent={handleSelectEvent}
                onEventDrop={onEventDrop}
                draggableAccessor={() => true}
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
            />

            {selectedTask && (
                <TaskDialog
                    members={members}
                    task={selectedTask}
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                />
            )}
        </div>
    );
}
