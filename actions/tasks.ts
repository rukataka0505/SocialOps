"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { toZonedTime, format } from "date-fns-tz";
import { Database } from "@/types/database.types";
import { SupabaseClient } from "@supabase/supabase-js";

import { getCurrentTeamId } from "@/lib/team-utils";

// Helper Types
export type TaskWithRelations = Database['public']['Tables']['tasks']['Row'] & {
    client?: { id: string; name: string } | null;
    assignments?: {
        user_id: string;
        role: string | null;
        user?: { id: string; name: string | null; avatar_url: string | null } | null;
    }[];
    subtasks?: (Database['public']['Tables']['tasks']['Row'] & {
        assignments?: {
            user_id: string;
            role: string | null;
            user?: { id: string; name: string | null; avatar_url: string | null } | null;
        }[];
        attributes?: any;
    })[];
    comments?: (Database['public']['Tables']['task_comments']['Row'] & {
        user?: { id: string; name: string | null; avatar_url: string | null } | null;
    })[];
    parent?: { id: string; title: string } | null;
};

export async function getTodayTasks() {
    const supabase = await createClient();

    try {
        const teamId = await getCurrentTeamId(supabase);
        if (!teamId) throw new Error("No team found");

        // Calculate today's date in JST
        const timeZone = 'Asia/Tokyo';
        const now = new Date();
        const zonedDate = toZonedTime(now, timeZone);
        const todayStr = format(zonedDate, 'yyyy-MM-dd', { timeZone });

        // Fetch tasks
        const { data: tasks, error } = await supabase
            .from("tasks")
            .select(`
                *,
                client:clients(
                    id,
                    name
                ),
                assignments:task_assignments(
                    user_id,
                    role,
                    user:users(
                        id,
                        name,
                        avatar_url
                    )
                ),
                subtasks:tasks(
                    *,
                    assignments:task_assignments(
                        user_id,
                        role,
                        user:users(
                            id,
                            name,
                            avatar_url
                        )
                    )
                ),
                comments:task_comments(
                    *,
                    user:users(
                        id,
                        name,
                        avatar_url
                    )
                )
            `)
            .eq("team_id", teamId)
            .neq("status", "completed")
            .lte("due_date", todayStr)
            .order("due_date", { ascending: true });

        if (error) throw error;

        // Filter for private tasks
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id;

        // Cast to unknown first then to custom type because Supabase types are complex with joins
        const typedTasks = tasks as unknown as TaskWithRelations[];

        const filteredTasks = typedTasks;

        const finalTasks = filteredTasks || [];

        // Custom sort for priority
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

        const sortedTasks = finalTasks.sort((a, b) => {
            // Primary sort: due_date
            if (a.due_date !== b.due_date) {
                if (a.due_date && b.due_date) {
                    return a.due_date.localeCompare(b.due_date);
                }
                return 0;
            }

            // Secondary sort: priority
            const pA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
            const pB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
            return pA - pB;
        });

        return sortedTasks;
    } catch (error) {
        console.error("Error fetching today's tasks:", error);
        return [];
    }
}

export async function toggleTaskStatus(taskId: string, isCompleted: boolean) {
    const supabase = await createClient();

    try {
        const status = isCompleted ? 'completed' : 'pending';
        const completed_at = isCompleted ? new Date().toISOString() : null;

        // First, get the task to check if it has a parent
        const { data: currentTask, error: fetchError } = await supabase
            .from("tasks")
            .select("id, parent_id, title")
            .eq("id", taskId)
            .single();

        if (fetchError) throw fetchError;

        // Update the task status
        const { error } = await supabase
            .from("tasks")
            .update({ status, completed_at })
            .eq("id", taskId);

        if (error) throw error;

        // Workflow Automation: If this is a child task, check parent status
        if (currentTask.parent_id) {
            const parentId = currentTask.parent_id;

            // Get all sibling tasks (including this one)
            const { data: siblings, error: siblingsError } = await supabase
                .from("tasks")
                .select("id, status, title")
                .eq("parent_id", parentId)
                .is("deleted_at", null);

            if (siblingsError) throw siblingsError;

            // Get parent task info
            const { data: parentTask, error: parentError } = await supabase
                .from("tasks")
                .select("id, title, attributes, assignments:task_assignments(user_id)")
                .eq("id", parentId)
                .single();

            if (parentError) throw parentError;

            const { data: { user } } = await supabase.auth.getUser();
            const currentUserId = user?.id;

            // Auto-Advance Logic: All siblings completed → Parent to "確認待ち"
            if (isCompleted) {
                const allCompleted = siblings.every((s: any) => s.status === 'completed');

                if (allCompleted) {
                    // Update parent workflow_status in attributes
                    const updatedAttributes = {
                        ...(parentTask.attributes as Record<string, any> || {}),
                        workflow_status: '確認待ち'
                    };
                    const { error: parentUpdateError } = await supabase
                        .from("tasks")
                        .update({ attributes: updatedAttributes })
                        .eq("id", parentId);

                    if (parentUpdateError) throw parentUpdateError;

                    // Notify parent task assignees
                    const { createNotification } = await import("./notifications");
                    const assigneeIds = parentTask.assignments
                        ?.map((a: any) => a.user_id)
                        .filter((id: string) => id !== currentUserId) || [];

                    if (assigneeIds.length > 0) {
                        await createNotification(
                            assigneeIds,
                            "status_change",
                            "タスクステータスが自動更新されました",
                            `全てのサブタスクが完了したため、タスク「${parentTask.title}」のステータスが「確認待ち」に変更されました。`,
                            `/dashboard?taskId=${parentId}`,
                            currentUserId
                        );
                    }
                }
            }
            // Auto-Revert Logic: Task uncompleted → Parent back to "進行中"
            else {
                const parentStatus = (parentTask.attributes as any)?.workflow_status;
                if (parentStatus === '確認待ち' || parentStatus === '完了') {
                    // Revert parent workflow_status in attributes
                    const updatedAttributes = {
                        ...(parentTask.attributes as Record<string, any> || {}),
                        workflow_status: '進行中'
                    };
                    const { error: parentRevertError } = await supabase
                        .from("tasks")
                        .update({ attributes: updatedAttributes })
                        .eq("id", parentId);

                    if (parentRevertError) throw parentRevertError;

                    // Notify parent task assignees
                    const { createNotification } = await import("./notifications");
                    const assigneeIds = parentTask.assignments
                        ?.map((a: any) => a.user_id)
                        .filter((id: string) => id !== currentUserId) || [];

                    if (assigneeIds.length > 0) {
                        await createNotification(
                            assigneeIds,
                            "status_change",
                            "タスクステータスが自動更新されました",
                            `サブタスクが未完了に戻されたため、タスク「${parentTask.title}」のステータスが「進行中」に変更されました。`,
                            `/dashboard?taskId=${parentId}`,
                            currentUserId
                        );
                    }
                }
            }
        }

        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Error toggling task status:", error);
        return { success: false, error };
    }
}

// Create a manual task (not from routine)
export async function createTask(prevState: any, formData: FormData) {
    const supabase = await createClient();

    try {
        const teamId = await getCurrentTeamId(supabase);
        if (!teamId) throw new Error("No team found");

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("Unauthorized");

        // Extract and validate form data
        const title = formData.get("title") as string;
        const due_date = formData.get("due_date") as string;
        const priority = (formData.get("priority") as string) || "medium";
        const status = (formData.get("status") as string) || "in_progress";

        const client_id = formData.get("client_id") as string;
        const workflow_status = formData.get("workflow_status") as string;
        const parent_id = formData.get("parent_id") as string;
        const is_milestone = formData.get("is_milestone") === "true";
        const is_private = formData.get("is_private") === "true";
        const source_type = (formData.get("source_type") as string) || "manual";

        // Handle assignees
        const assigneesJson = formData.get("assignees") as string;
        let assignees: { userId: string, role: string }[] = [];
        if (assigneesJson) {
            try {
                assignees = JSON.parse(assigneesJson);
            } catch (e) {
                console.error("Failed to parse assignees JSON", e);
            }
        }

        // Force assign creator for private tasks
        if (is_private) {
            const isCreatorAssigned = assignees.some(a => a.userId === user.id);
            if (!isCreatorAssigned) {
                assignees.push({ userId: user.id, role: 'owner' });
            }
        }

        // Enforce is_private based on hierarchy
        // Child Task -> Private
        // Parent Task -> Public (Team)
        let finalIsPrivate = is_private;
        if (parent_id) {
            finalIsPrivate = true;
        } else {
            finalIsPrivate = false;
        }

        // Handle attributes
        const attributes: Record<string, any> = {};
        const management_url = formData.get("management_url") as string;
        if (management_url) {
            attributes.management_url = management_url;
        }

        // Store workflow_status in attributes
        if (workflow_status) {
            attributes.workflow_status = workflow_status;
        }

        // Extract custom field definitions if present
        const customFieldsJson = formData.get("_fields") as string;
        if (customFieldsJson) {
            try {
                attributes._fields = JSON.parse(customFieldsJson);
            } catch (e) {
                console.error("Failed to parse custom fields JSON", e);
            }
        }

        for (const [key, value] of Array.from(formData.entries())) {
            if (key.startsWith('custom_')) {
                attributes[key.replace('custom_', '')] = value;
            }
        }

        if (!title || !due_date) {
            return { success: false, error: "タイトルと期限は必須です" };
        }

        // Insert task
        const { data: task, error } = await supabase
            .from("tasks")
            .insert({
                team_id: teamId,
                title,
                due_date,
                priority,
                client_id: client_id || null,
                attributes,
                status,
                created_by: user.id,
                parent_id: parent_id || null,
                is_milestone,
                is_private: finalIsPrivate,
                source_type,
            })
            .select()
            .single();

        if (error) throw error;

        // Insert assignments
        if (assignees.length > 0) {
            const assignments = assignees.map(a => ({
                task_id: task.id,
                user_id: a.userId,
                role: a.role
            }));

            const { error: assignError } = await supabase
                .from("task_assignments")
                .insert(assignments);

            if (assignError) {
                console.error("Error inserting assignments:", assignError);
                // Non-fatal, but good to know
            }
        }


        // Notify new assignees
        if (assignees.length > 0) {
            const { createNotification } = await import("./notifications");
            const assigneeIds = assignees.map(a => a.userId).filter(id => id !== user.id);

            if (assigneeIds.length > 0) {
                await createNotification(
                    assigneeIds,
                    "assignment",
                    `タスクが割り当てられました: ${title}`,
                    `あなたに新しいタスク「${title}」が割り当てられました。`,
                    `/dashboard?taskId=${task.parent_id || task.id}`,
                    user.id
                );
            }
        }


        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Error creating task:", error);
        return { success: false, error: "タスクの作成に失敗しました" };
    }
}

export async function getTasks(start: string, end: string) {
    const supabase = await createClient();

    try {
        const teamId = await getCurrentTeamId(supabase);
        if (!teamId) throw new Error("No team found");

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");


        const { data: tasks, error } = await supabase
            .from("tasks")
            .select(`
                *,
                client:clients(
                    id,
                    name
                ),
                assignments:task_assignments(
                    user_id,
                    role,
                    user:users(
                        id,
                        name,
                        avatar_url
                    )
                )
            `)
            .eq("team_id", teamId)
            .eq("team_id", teamId)
            .or(`is_private.eq.false,and(is_private.eq.true,created_by.eq.${user.id})`)
            .gte("due_date", start)
            .lte("due_date", end)
            .is("deleted_at", null);

        if (error) throw error;

        // Explicitly cast the return value to TaskWithRelations[]
        return (tasks || []) as unknown as TaskWithRelations[];
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
    }
}

export async function updateTask(taskId: string, data: any) {
    const supabase = await createClient();

    try {
        const teamId = await getCurrentTeamId(supabase);
        if (!teamId) throw new Error("No team found");

        // Separate assignees from task data
        let { assignees, ...taskData } = data;

        // Parse assignees if it's a string (from FormData)
        if (typeof assignees === 'string') {
            try {
                assignees = JSON.parse(assignees);
            } catch (e) {
                console.error("Failed to parse assignees JSON in updateTask", e);
                assignees = [];
            }
        }

        // Remove undefined fields
        const updateData: any = Object.fromEntries(
            Object.entries(taskData).filter(([_, v]) => v !== undefined)
        );

        // Handle all UUID fields - convert empty strings to null to avoid UUID errors
        const uuidFields = ['client_id', 'project_id', 'routine_id', 'assigned_to', 'parent_id'];
        uuidFields.forEach(field => {
            if (updateData[field] === "" || updateData[field] === "undefined") {
                updateData[field] = null;
            }
        });

        // Handle is_private boolean
        if (updateData.is_private !== undefined) {
            // Ensure it's boolean
            updateData.is_private = Boolean(updateData.is_private);
        }

        // Enforce is_private based on hierarchy logic
        const { data: currentTaskForUpdate, error: fetchCurrentError } = await supabase
            .from("tasks")
            .select("parent_id, is_milestone")
            .eq("id", taskId)
            .single();

        if (!fetchCurrentError && currentTaskForUpdate) {
            const parentId = updateData.parent_id !== undefined ? updateData.parent_id : currentTaskForUpdate.parent_id;

            if (parentId) {
                // It's a child task -> Force Private
                updateData.is_private = true;
            } else {
                // It's a parent task -> Force Public
                updateData.is_private = false;
            }
        }

        // Handle _fields - it should be inside attributes, not a top-level field
        if (updateData._fields) {
            if (!updateData.attributes) {
                updateData.attributes = {};
            }
            // Parse _fields if it's a JSON string
            let fieldsValue = updateData._fields;
            if (typeof fieldsValue === 'string') {
                try {
                    fieldsValue = JSON.parse(fieldsValue);
                } catch (e) {
                    console.error('Failed to parse _fields:', e);
                }
            }
            updateData.attributes._fields = fieldsValue;
            delete updateData._fields;
        }

        // Also check attributes object for UUID fields
        if (updateData.attributes && typeof updateData.attributes === 'object') {
            Object.keys(updateData.attributes).forEach(key => {
                const value = updateData.attributes[key];
                // Don't delete _fields
                if (key !== '_fields' && (value === "" || value === "undefined" || value === null)) {
                    delete updateData.attributes[key];
                }
            });
        }

        // Move workflow_status to attributes
        if (updateData.workflow_status) {
            if (!updateData.attributes) {
                updateData.attributes = {};
            }
            updateData.attributes.workflow_status = updateData.workflow_status;
            delete updateData.workflow_status;
        }

        // If we are updating attributes, we need to merge with existing attributes
        if (updateData.attributes) {
            const { data: currentTask, error: fetchError } = await supabase
                .from("tasks")
                .select("attributes")
                .eq("id", taskId)
                .single();

            if (!fetchError && currentTask) {
                updateData.attributes = {
                    ...(currentTask.attributes as Record<string, any> || {}),
                    ...updateData.attributes
                };
            }
        }

        const finalUpdatePayload = {
            ...updateData,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from("tasks")
            .update(finalUpdatePayload)
            .eq("id", taskId)
            .eq("team_id", teamId);

        if (error) {
            console.error('Supabase update error:', error);
            throw error;
        }

        // Update assignments if provided
        if (assignees) {
            // Delete existing assignments
            await supabase
                .from("task_assignments")
                .delete()
                .eq("task_id", taskId);

            // Insert new assignments
            if (assignees.length > 0) {
                // Filter out empty userIds
                const validAssignees = assignees.filter((a: any) => a.userId && a.userId.trim() !== '');

                if (validAssignees.length > 0) {
                    const assignments = validAssignees.map((a: any) => ({
                        task_id: taskId,
                        user_id: a.userId,
                        role: a.role
                    }));

                    const { error: assignError } = await supabase
                        .from("task_assignments")
                        .insert(assignments);

                    if (assignError) throw assignError;
                }
            }
        }

        // Notify new assignees (only if assignments changed)
        if (assignees && assignees.length > 0) {
            const { createNotification } = await import("./notifications");
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const assigneeIds = assignees
                    .map((a: any) => a.userId)
                    .filter((id: string) => id !== user.id);

                if (assigneeIds.length > 0) {
                    // Fetch task title if not in update data
                    let taskTitle = updateData.title;
                    if (!taskTitle) {
                        const { data: t } = await supabase.from("tasks").select("title, parent_id, id").eq("id", taskId).single();
                        taskTitle = t?.title;
                        // Also ensure we have the correct link ID
                        if (t) {
                            await createNotification(
                                assigneeIds,
                                "assignment",
                                `タスクが割り当てられました: ${taskTitle}`,
                                `タスク「${taskTitle}」の担当者に設定されました。`,
                                `/dashboard?taskId=${t.parent_id || t.id}`,
                                user.id
                            );
                        }
                    } else {
                        // If we have title in updateData, we still need parent_id for the link
                        const { data: t } = await supabase.from("tasks").select("parent_id, id").eq("id", taskId).single();
                        if (t) {
                            await createNotification(
                                assigneeIds,
                                "assignment",
                                `タスクが割り当てられました: ${taskTitle}`,
                                `タスク「${taskTitle}」の担当者に設定されました。`,
                                `/dashboard?taskId=${t.parent_id || t.id}`,
                                user.id
                            );
                        }
                    }
                }
            }
        }

        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Error updating task:", error);
        return { success: false, error };
    }
}

export async function deleteTask(taskId: string) {
    const supabase = await createClient();

    try {
        const teamId = await getCurrentTeamId(supabase);
        if (!teamId) throw new Error("No team found");

        // Soft delete
        const { error } = await supabase
            .from("tasks")
            .update({
                deleted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", taskId)
            .eq("team_id", teamId);

        if (error) throw error;

        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Error deleting task:", error);
        return { success: false, error };
    }
}

export async function getMemberTasks(userId: string) {
    const supabase = await createClient();

    try {
        const teamId = await getCurrentTeamId(supabase);
        if (!teamId) throw new Error("No team found");

        // Find tasks assigned to user via task_assignments
        const { data: tasks, error } = await supabase
            .from("tasks")
            .select(`
                *,
                client:clients(id, name),
                assignments:task_assignments!inner(user_id, role, user:users(id, name, avatar_url))
            `)
            .eq("team_id", teamId)
            .eq("created_by", userId) // Must be created by me
            .eq("is_private", true)   // Must be private
            .neq("status", "completed")
            .is("deleted_at", null)
            .order("due_date", { ascending: true });

        if (error) throw error;

        return tasks || [];
    } catch (error) {
        console.error("Error fetching member tasks:", error);
        return [];
    }
}

export async function getClientMilestones(clientId: string, start: Date, end: Date) {
    const supabase = await createClient();

    try {
        const teamId = await getCurrentTeamId(supabase);
        if (!teamId) throw new Error("No team found");
        const startStr = format(start, 'yyyy-MM-dd', { timeZone: 'Asia/Tokyo' });
        const endStr = format(end, 'yyyy-MM-dd', { timeZone: 'Asia/Tokyo' });

        const { data: tasks, error } = await supabase
            .from("tasks")
            .select(`
                *,
                client:clients(id, name),
                assignments:task_assignments(user_id, role, user:users(id, name, avatar_url)),
                subtasks:tasks(
                    *,
                    assignments:task_assignments(user_id, role, user:users(id, name, avatar_url)),
                    attributes
                ),
                comments:task_comments(
                    *,
                    user:users(id, name, avatar_url)
                )
            `)
            .eq("team_id", teamId)
            .eq("client_id", clientId)
            .eq("is_milestone", true)
            .gte("due_date", startStr)
            .lte("due_date", endStr)
            .is("deleted_at", null)
            .order("due_date", { ascending: true });

        if (error) throw error;

        return tasks || [];
    } catch (error) {
        console.error("Error fetching client milestones:", error);
        return [];
    }
}

export async function getSubtasks(parentId: string) {
    const supabase = await createClient();

    try {
        const teamId = await getCurrentTeamId(supabase);
        if (!teamId) throw new Error("No team found");

        const { data: tasks, error } = await supabase
            .from("tasks")
            .select(`
                *,
                assignments:task_assignments(
                    user_id,
                    role,
                    user:users(
                        id,
                        name,
                        avatar_url
                    )
                )
            `)
            .eq("team_id", teamId)
            .eq("parent_id", parentId)
            .is("deleted_at", null)
            .order("due_date", { ascending: true });

        if (error) throw error;

        return tasks || [];
    } catch (error) {
        console.error("Error fetching subtasks:", error);
        return [];
    }
}

export async function getTaskComments(taskId: string) {
    const supabase = await createClient();

    try {
        const teamId = await getCurrentTeamId(supabase);
        if (!teamId) throw new Error("No team found");

        const { data: comments, error } = await supabase
            .from("task_comments")
            .select(`
                *,
                user:users(
                    id,
                    name,
                    avatar_url
                )
            `)
            .eq("task_id", taskId)
            .order("created_at", { ascending: true });

        if (error) throw error;

        return comments || [];
    } catch (error) {
        console.error("Error fetching task comments:", error);
        return [];
    }
}

export async function addComment(taskId: string, content: string) {
    const supabase = await createClient();

    try {
        const teamId = await getCurrentTeamId(supabase);
        if (!teamId) throw new Error("No team found");
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("Unauthorized");

        const { error } = await supabase
            .from("task_comments")
            .insert({
                task_id: taskId,
                user_id: user.id,
                content: content
            });

        if (error) throw error;

        // Notify subscribers
        const { getTaskSubscribers, createNotification } = await import("./notifications");
        const subscribers = await getTaskSubscribers(taskId, user.id);

        if (subscribers.length > 0) {
            const { data: task } = await supabase
                .from("tasks")
                .select("title, parent_id, id")
                .eq("id", taskId)
                .single();

            if (task) {
                const linkId = task.parent_id || task.id;

                await createNotification(
                    subscribers,
                    "comment",
                    `${user.user_metadata?.name || 'ユーザー'}がコメントしました`,
                    content,
                    `/dashboard?taskId=${linkId}`,
                    user.id
                );
            }
        }

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error adding comment:", error);
        return { success: false, error };
    }
}

export async function submitDeliverable(taskId: string, url: string) {
    const supabase = await createClient();

    try {
        const teamId = await getCurrentTeamId(supabase);
        if (!teamId) throw new Error("No team found");

        // First get current attributes
        const { data: task, error: fetchError } = await supabase
            .from("tasks")
            .select("attributes")
            .eq("id", taskId)
            .single();

        if (fetchError) throw fetchError;

        const currentAttributes = (task.attributes as Record<string, any>) || {};
        const newAttributes = {
            ...currentAttributes,
            submission_url: url
        };

        const { error } = await supabase
            .from("tasks")
            .update({
                attributes: newAttributes,
                updated_at: new Date().toISOString()
            })
            .eq("id", taskId)
            .eq("team_id", teamId);

        if (error) throw error;

        // Notify subscribers about submission
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { getTaskSubscribers, createNotification } = await import("./notifications");
            const subscribers = await getTaskSubscribers(taskId, user.id);

            if (subscribers.length > 0) {
                const { data: t } = await supabase.from("tasks").select("title, parent_id, id").eq("id", taskId).single();
                if (t) {
                    await createNotification(
                        subscribers,
                        "submission",
                        `${user.user_metadata?.name || 'ユーザー'}が提出物をアップロードしました`,
                        `タスク「${t.title}」に提出物がアップロードされました。`,
                        `/dashboard?taskId=${t.parent_id || t.id}`,
                        user.id
                    );
                }
            }
        }

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error submitting deliverable:", error);
        return { success: false, error };
    }
}

export async function getTaskWithHierarchy(taskId: string) {
    const supabase = await createClient();

    try {
        const teamId = await getCurrentTeamId(supabase);
        if (!teamId) throw new Error("No team found");

        // Fetch full details for the target task (Self)
        const { data: task, error } = await supabase
            .from("tasks")
            .select(`
                *,
                client:clients(id, name, spreadsheet_url),
                parent:tasks(id, title),
                assignments:task_assignments(user_id, role, user:users(id, name, avatar_url)),
                subtasks:tasks(
                    *,
                    assignments:task_assignments(user_id, role, user:users(id, name, avatar_url)),
                    attributes
                ),
                comments:task_comments(
                    *,
                    user:users(id, name, avatar_url)
                )
            `)
            .eq("id", taskId)
            .eq("team_id", teamId)
            .single();

        if (error) throw error;

        // Cast to TaskWithRelations to handle complex structure
        const typedTask = task as unknown as TaskWithRelations;

        // Sort subtasks and comments
        if (typedTask.subtasks) {
            typedTask.subtasks.sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        }
        if (typedTask.comments) {
            typedTask.comments.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }

        return typedTask;
    } catch (error) {
        console.error("Error fetching task hierarchy:", error);
        return null;
    }
}
