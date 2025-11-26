"use client";

import { useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ja } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskDialog } from "@/components/tasks/task-dialog";

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

interface CalendarBoardProps {
    tasks: any[];
    members: any[];
}

export function CalendarBoard({ tasks, members }: CalendarBoardProps) {
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const events = tasks.map(task => ({
        id: task.id,
        title: task.title,
        start: new Date(task.due_date),
        end: new Date(task.due_date),
        allDay: true,
        resource: task,
    }));

    const handleSelectEvent = useCallback((event: any) => {
        setSelectedTask(event.resource);
        setIsDialogOpen(true);
    }, []);

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
            const assignee = task.assignee;

            return (
                <div className="flex items-center gap-1 overflow-hidden px-1 h-full">
                    {assignee && (
                        <Avatar className="h-4 w-4 border border-white shrink-0">
                            <AvatarImage src={assignee.avatar_url || ""} />
                            <AvatarFallback className="text-[8px]">{assignee.name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                    )}
                    <span className="truncate font-medium">{event.title}</span>
                </div>
            );
        },
    };

    return (
        <div className="h-full w-full bg-white p-4 rounded-lg shadow-sm border flex flex-col">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "calc(100vh - 140px)" }}
                views={['month', 'week', 'day']}
                view={view}
                date={date}
                onView={setView}
                onNavigate={setDate}
                culture="ja"
                onSelectEvent={handleSelectEvent}
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
