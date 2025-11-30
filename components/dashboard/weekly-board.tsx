"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    DragEndEvent,
    DragStartEvent,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    format,
    startOfWeek,
    addDays,
    isToday,
    isSameDay,
    parseISO,
    isValid,
} from "date-fns";
import { ja } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, AlertCircle } from "lucide-react";
import { updateTask } from "@/actions/tasks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// --- Types ---

interface Task {
    id: string;
    title: string;
    due_date: string | null;
    priority: string;
    status: string;
    assignments: {
        user_id: string;
        user: {
            name: string;
            avatar_url: string | null;
        } | null;
    }[];
    [key: string]: any;
}

interface WeeklyBoardProps {
    tasks: Task[];
    currentDate: Date;
    onTaskClick: (task: Task) => void;
}

// --- Components ---

const TaskCard = React.memo(function TaskCard({ task, isOverlay = false, onClick }: { task: Task; isOverlay?: boolean; onClick?: () => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { task },
        disabled: isOverlay, // Disable dragging if it's the overlay itself (though overlay usually isn't interactive)
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    const priorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'low': return 'text-slate-600 bg-slate-50 border-slate-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const priorityLabel = (priority: string) => {
        switch (priority) {
            case 'urgent': return '緊急';
            case 'high': return '高';
            case 'medium': return '中';
            case 'low': return '低';
            default: return priority;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={cn(
                "group relative flex flex-col gap-2 p-3 rounded-lg border bg-white shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing",
                isDragging ? "opacity-50" : "opacity-100",
                isOverlay ? "shadow-xl scale-105 rotate-2 cursor-grabbing" : "border-slate-200"
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-slate-900 line-clamp-2 leading-tight">
                    {task.title}
                </span>
            </div>

            <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", priorityColor(task.priority))}>
                        {priorityLabel(task.priority)}
                    </span>
                </div>

                <div className="flex -space-x-1.5">
                    {task.assignments?.slice(0, 3).map((a) => (
                        <Avatar key={a.user_id} className="h-5 w-5 border border-white">
                            <AvatarImage src={a.user?.avatar_url || ""} />
                            <AvatarFallback className="text-[8px]">{a.user?.name?.[0]}</AvatarFallback>
                        </Avatar>
                    ))}
                </div>
            </div>
        </div>
    );
});

const DayColumn = React.memo(function DayColumn({ date, tasks, onTaskClick }: { date: Date; tasks: Task[]; onTaskClick: (task: Task) => void }) {
    const dateStr = format(date, "yyyy-MM-dd");
    const { setNodeRef, isOver } = useDroppable({
        id: dateStr,
        data: { date: dateStr },
    });

    const isTodayDate = isToday(date);

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col w-full h-full border-r last:border-r-0 transition-colors",
                isOver ? "bg-blue-50/50" : "bg-slate-50/50",
                isTodayDate ? "bg-blue-50/30" : ""
            )}
        >
            {/* Header */}
            <div className={cn(
                "p-3 border-b flex flex-col items-center justify-center gap-1 sticky top-0 z-10 backdrop-blur-sm",
                isTodayDate ? "bg-blue-100/50 border-blue-200" : "bg-slate-100/50 border-slate-200"
            )}>
                <span className={cn("text-xs font-medium", isTodayDate ? "text-blue-600" : "text-slate-500")}>
                    {format(date, "E", { locale: ja })}
                </span>
                <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                    isTodayDate ? "bg-blue-600 text-white shadow-sm" : "text-slate-700"
                )}>
                    {format(date, "d")}
                </div>
            </div>

            {/* Tasks List */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[100px]">
                {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
                ))}
            </div>
        </div>
    );
});

export function WeeklyBoard({ tasks: initialTasks, currentDate, onTaskClick }: WeeklyBoardProps) {
    const [tasks, setTasks] = useState(initialTasks);
    const [activeId, setActiveId] = useState<string | null>(null);
    const router = useRouter();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Generate 7 days starting from Monday of the current week
    const days = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [currentDate]);

    // Group tasks by date
    const tasksByDate = useMemo(() => {
        const groups: Record<string, Task[]> = {};
        days.forEach((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            groups[dateStr] = [];
        });

        tasks.forEach((task) => {
            if (task.due_date) {
                // Ensure we only group tasks that fall within our week view if we want strict filtering,
                // but usually we just map them.
                // However, the date string from DB might be ISO.
                const taskDate = format(parseISO(task.due_date), "yyyy-MM-dd");
                if (groups[taskDate]) {
                    groups[taskDate].push(task);
                }
            }
        });
        return groups;
    }, [tasks, days]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const taskId = active.id as string;
        const newDateStr = over.id as string; // The column ID is the date string

        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        // Optimistic Update
        const oldDate = task.due_date;
        if (oldDate === newDateStr) {
            setActiveId(null);
            return;
        }

        const updatedTask = { ...task, due_date: newDateStr };
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

        try {
            const result = await updateTask(taskId, { due_date: newDateStr });
            if (!result.success) {
                throw new Error("Failed to update");
            }
            router.refresh();
        } catch (error) {
            toast.error("タスクの移動に失敗しました");
            // Revert
            setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
        }

        setActiveId(null);
    };

    const activeTask = useMemo(() => tasks.find((t) => t.id === activeId), [activeId, tasks]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-7 h-full border rounded-xl overflow-hidden bg-white">
                {days.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    return (
                        <DayColumn
                            key={dateStr}
                            date={day}
                            tasks={tasksByDate[dateStr] || []}
                            onTaskClick={onTaskClick}
                        />
                    );
                })}
            </div>

            <DragOverlay>
                {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}
