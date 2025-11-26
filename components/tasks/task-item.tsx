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
        }
    };

    if (!isVisible) return null;

    // Priority localization and colors
    const priorityConfig = {
        urgent: { label: "緊急", className: "bg-red-50 text-red-700 border-red-200" },
        high: { label: "高", className: "bg-orange-50 text-orange-700 border-orange-200" },
        medium: { label: "中", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
        low: { label: "低", className: "bg-blue-50 text-blue-700 border-blue-200" },
    };

    const config = priorityConfig[task.priority] || priorityConfig.medium;

    // Check expired
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const isOverdue = task.due_date && task.due_date < todayStr;

    return (
        <div className="group flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-gray-200 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-4">
                <Checkbox
                    checked={isCompleted}
                    onCheckedChange={(checked) => handleToggle(checked as boolean)}
                    id={`task-${task.id}`}
                    className="h-5 w-5 rounded-full border-2 border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 transition-colors"
                />
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor={`task-${task.id}`}
                        className={cn(
                            "font-medium cursor-pointer text-gray-900 text-base transition-colors",
                            isCompleted && "line-through text-gray-400"
                        )}
                    >
                        {task.title}
                    </label>
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-md border font-bold tracking-wide",
                            config.className
                        )}>
                            {config.label}
                        </span>
                        {isOverdue && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border bg-rose-50 text-rose-600 border-rose-200 font-bold tracking-wide">
                                ⚠️ 期限切れ
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="text-sm text-gray-400 font-medium">
                {task.due_date}
            </div>
        </div>
    );
}
