"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { getTaskWithHierarchy } from "@/actions/tasks";

export function TaskUrlHandler() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const taskId = searchParams.get("taskId");

    const [task, setTask] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (taskId) {
            const fetchTask = async () => {
                const taskData = await getTaskWithHierarchy(taskId);
                if (taskData) {
                    setTask(taskData);
                    setIsOpen(true);
                }
            };
            fetchTask();
        } else {
            setIsOpen(false);
            setTask(null);
        }
    }, [taskId]);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            // Remove taskId from URL without refreshing
            const params = new URLSearchParams(searchParams.toString());
            params.delete("taskId");
            router.replace(`${pathname}?${params.toString()}`);
        }
    };

    if (!task) return null;

    return (
        <TaskDialog
            task={task}
            open={isOpen}
            onOpenChange={handleOpenChange}
            mode="edit"
            settings={{}} // We might need to pass actual settings here if possible, or make TaskDialog robust enough
        />
    );
}
