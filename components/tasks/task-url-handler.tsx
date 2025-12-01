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

    const focusSubtaskId = searchParams.get("focusSubtaskId");

    const [task, setTask] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (taskId) {
            const fetchTask = async () => {
                const taskData = await getTaskWithHierarchy(taskId);
                if (taskData) {
                    // Check if it's a child task
                    if (taskData.parent_id) {
                        // Redirect to parent task with focusSubtaskId
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("taskId", taskData.parent_id);
                        params.set("focusSubtaskId", taskData.id);
                        router.replace(`${pathname}?${params.toString()}`);
                        return;
                    }

                    setTask(taskData);
                    setIsOpen(true);
                }
            };
            fetchTask();
        } else {
            setIsOpen(false);
            setTask(null);
        }
    }, [taskId, pathname, router, searchParams]);

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
            members={[]} // Will be fetched by TaskDialog itself
            settings={{}} // Will be fetched by TaskDialog itself
            focusSubtaskId={focusSubtaskId}
        />
    );
}
