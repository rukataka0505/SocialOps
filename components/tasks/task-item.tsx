"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleTaskStatus } from "@/actions/tasks";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Task {
    id: string;
    title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date: string | null;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export function TaskItem({ task }: { task: Task }) {
    const [isCompleted, setIsCompleted] = useState(task.status === 'completed');
    const [isVisible, setIsVisible] = useState(true);

    const handleToggle = async (checked: boolean) => {
        setIsCompleted(checked);
        setIsVisible(false); // Optimistically hide
        try {
            await toggleTaskStatus(task.id, checked);
        } catch (error) {
            console.error("Failed to toggle task", error);
            setIsVisible(true); // Revert if failed
            setIsCompleted(!checked);
        }
    };

    if (!isVisible) return null;

    // Priority colors
    const priorityColors = {
        urgent: "bg-red-100 text-red-800 border-red-200",
        high: "bg-orange-100 text-orange-800 border-orange-200",
        medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
        low: "bg-blue-100 text-blue-800 border-blue-200",
    };

    // Check expired
    // Simple string comparison for YYYY-MM-DD
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const isOverdue = task.due_date && task.due_date < todayStr;

    return (
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
                <Checkbox
                    checked={isCompleted}
                    onCheckedChange={(checked) => handleToggle(checked as boolean)}
                    id={`task-${task.id}`}
                    className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
                <div className="flex flex-col">
                    <label
                        htmlFor={`task-${task.id}`}
                        className={cn(
                            "font-medium cursor-pointer text-gray-900",
                            isCompleted && "line-through text-gray-400"
                        )}
                    >
                        {task.title}
                    </label>
                    <div className="flex gap-2 mt-1.5">
                        <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider",
                            priorityColors[task.priority]
                        )}>
                            {task.priority}
                        </span>
                        {isOverdue && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200 font-medium uppercase tracking-wider">
                                Expired
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="text-sm text-gray-500 font-mono">
                {task.due_date}
            </div>
        </div>
    );
}
