"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { toZonedTime, format } from "date-fns-tz";
import { Database } from "@/types/database.types";
import { SupabaseClient } from "@supabase/supabase-js";

// Helper to get team ID
async function getTeamId(supabase: SupabaseClient<Database>) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { data: teamMember, error: teamError } = await (supabase as any)
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .single();

    if (teamError || !teamMember) throw new Error("No team found for user");
    return teamMember.team_id;
}

export async function getTodayTasks() {
    const supabase = await createClient();

    try {
        const teamId = await getTeamId(supabase);

        // Calculate today's date in JST
        const timeZone = 'Asia/Tokyo';
        const now = new Date();
        const zonedDate = toZonedTime(now, timeZone);
        const todayStr = format(zonedDate, 'yyyy-MM-dd', { timeZone });

        // Fetch tasks
        const { data: tasks, error } = await (supabase as any)
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

        // Custom sort for priority
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

        const sortedTasks = tasks?.sort((a: any, b: any) => {
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

        return sortedTasks || [];
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
        const { data: currentTask, error: fetchError } = await (supabase as any)
            .from("tasks")
            .select("id, parent_id, title")
            .eq("id", taskId)
            .single();

        if (fetchError) throw fetchError;

        // Update the task status
        const { error } = await (supabase as any)
            .from("tasks")
            .update({ status, completed_at })
            .eq("id", taskId);

        if (error) throw error;

        // Workflow Automation: If this is a child task, check parent status
        if (currentTask.parent_id) {
            const parentId = currentTask.parent_id;

            // Get all sibling tasks (including this one)
            const { data: siblings, error: siblingsError } = await (supabase as any)
                .from("tasks")
                .select("id, status, title")
                .eq("parent_id", parentId)
                .is("deleted_at", null);

            if (siblingsError) throw siblingsError;

            // Get parent task info
            const { data: parentTask, error: parentError } = await (supabase as any)
                .from("tasks")
                .select("id, title, workflow_status, assignments:task_assignments(user_id)")
                .eq("id", parentId)
                .single();

            if (parentError) throw parentError;

            const { data: { user } } = await supabase.auth.getUser();
            const currentUserId = user?.id;

            // Auto-Advance Logic: All siblings completed → Parent to "確認待ち"
            if (isCompleted) {
                const allCompleted = siblings.every((s: any) => s.status === 'completed');

                if (allCompleted) {
                    // Update parent to "確認待ち"
                    const { error: parentUpdateError } = await (supabase as any)
                        .from("tasks")
                        .update({ workflow_status: '確認待ち' })
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
                const parentStatus = parentTask.workflow_status;
                if (parentStatus === '確認待ち' || parentStatus === '完了') {
                    // Revert parent to "進行中"
                    const { error: parentRevertError } = await (supabase as any)
                        .from("tasks")
                        .update({ workflow_status: '進行中' })
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

        revalidatePath("/");
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
        const teamId = await getTeamId(supabase);

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

        // Handle attributes
        const attributes: Record<string, any> = {};
        const management_url = formData.get("management_url") as string;
        if (management_url) {
            attributes.management_url = management_url;
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
        const { data: task, error } = await (supabase as any)
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
                workflow_status: workflow_status || null,
                parent_id: parent_id || null,
                is_milestone,
                is_private,
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

            const { error: assignError } = await (supabase as any)
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


        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error creating task:", error);
        return { success: false, error: "タスクの作成に失敗しました" };
    }
}

export async function getTasks(start: string, end: string) {
    const supabase = await createClient();

    try {
        const teamId = await getTeamId(supabase);

        const { data: tasks, error } = await (supabase as any)
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
            .gte("due_date", start)
            .lte("due_date", end)
            .is("deleted_at", null);

        if (error) throw error;

        return tasks || [];
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
    }
}

export async function updateTask(taskId: string, data: any) {
    const supabase = await createClient();

    try {
        const teamId = await getTeamId(supabase);

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

        const finalUpdatePayload = {
            ...updateData,
            updated_at: new Date().toISOString(),
        };

        const { error } = await (supabase as any)
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
            await (supabase as any)
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

                    const { error: assignError } = await (supabase as any)
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
                // We only notify users who are newly assigned. 
                // Since we deleted and re-inserted, we might notify existing users again if we are not careful.
                // For simplicity in this phase, we notify all current assignees except the actor.
                // A better approach would be to diff, but "re-assignment" notification is also acceptable.

                const assigneeIds = assignees
                    .map((a: any) => a.userId)
                    .filter((id: string) => id !== user.id);

                if (assigneeIds.length > 0) {
                    // Fetch task title if not in update data
                    let taskTitle = updateData.title;
                    if (!taskTitle) {
                        const { data: t } = await (supabase as any).from("tasks").select("title, parent_id, id").eq("id", taskId).single();
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
                        const { data: t } = await (supabase as any).from("tasks").select("parent_id, id").eq("id", taskId).single();
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

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error updating task:", error);
        return { success: false, error };
    }
}

export async function deleteTask(taskId: string) {
    const supabase = await createClient();

    try {
        const teamId = await getTeamId(supabase);

        // Soft delete
        const { error } = await (supabase as any)
            .from("tasks")
            .update({
                deleted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", taskId)
            .eq("team_id", teamId);

        if (error) throw error;

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error deleting task:", error);
        return { success: false, error };
    }
}

export async function getMemberTasks(userId: string) {
    const supabase = await createClient();

    try {
        const teamId = await getTeamId(supabase);

        // Find tasks assigned to user via task_assignments
        // We can use a join or a subquery.
        // Supabase join syntax:
        const { data: tasks, error } = await (supabase as any)
            .from("tasks")
            .select(`
                *,
                client:clients(id, name),
                assignments:task_assignments!inner(user_id, role, user:users(id, name, avatar_url)),
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
            .eq("assignments.user_id", userId)
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
        const teamId = await getTeamId(supabase);
        const startStr = format(start, 'yyyy-MM-dd', { timeZone: 'Asia/Tokyo' });
        const endStr = format(end, 'yyyy-MM-dd', { timeZone: 'Asia/Tokyo' });

        const { data: tasks, error } = await (supabase as any)
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
        const teamId = await getTeamId(supabase);

        const { data: tasks, error } = await (supabase as any)
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
        const teamId = await getTeamId(supabase);

        const { data: comments, error } = await (supabase as any)
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
        const teamId = await getTeamId(supabase);
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("Unauthorized");

        const { error } = await (supabase as any)
            .from("task_comments")
            .insert({
                task_id: taskId,
                user_id: user.id,
                content: content
            });

        if (error) throw error;

        // Notify subscribers
        // We do this asynchronously to not block the UI response if possible, 
        // but since this is a server action, we just await it.
        // 1. Get subscribers
        const { getTaskSubscribers, createNotification } = await import("./notifications");
        const subscribers = await getTaskSubscribers(taskId, user.id);

        // 2. Create notification
        if (subscribers.length > 0) {
            // Get task title for the notification
            const { data: task } = await (supabase as any)
                .from("tasks")
                .select("title, parent_id, id")
                .eq("id", taskId)
                .single();

            if (task) {
                // Determine the ID to link to (parent if it exists, or self)
                // Actually, the spec says: URL: `/dashboard?taskId={親タスクID}`
                // So we need to find the top-level parent ID.
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
        const teamId = await getTeamId(supabase);

        // First get current attributes
        const { data: task, error: fetchError } = await (supabase as any)
            .from("tasks")
            .select("attributes")
            .eq("id", taskId)
            .single();

        if (fetchError) throw fetchError;

        const currentAttributes = task.attributes || {};
        const newAttributes = {
            ...currentAttributes,
            submission_url: url
        };

        const { error } = await (supabase as any)
            .from("tasks")
            .update({
                attributes: newAttributes,
                updated_at: new Date().toISOString()
            })
            .eq("id", taskId)
            .eq("team_id", teamId);

        if (error) throw error;

        if (error) throw error;

        // Notify subscribers about submission
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { getTaskSubscribers, createNotification } = await import("./notifications");
            const subscribers = await getTaskSubscribers(taskId, user.id);

            if (subscribers.length > 0) {
                const { data: t } = await (supabase as any).from("tasks").select("title, parent_id, id").eq("id", taskId).single();
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
        const teamId = await getTeamId(supabase);

        // 1. Get the target task to check for parent_id
        const { data: initialTask, error: initialError } = await (supabase as any)
            .from("tasks")
            .select("id, parent_id")
            .eq("id", taskId)
            .single();

        if (initialError) throw initialError;

        // 2. Determine the actual ID to fetch (Parent or Self)
        const targetId = initialTask.parent_id || initialTask.id;

        // 3. Fetch full details for the target task
        const { data: task, error } = await (supabase as any)
            .from("tasks")
            .select(`
                *,
                client:clients(id, name, spreadsheet_url),
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
            .eq("id", targetId)
            .eq("team_id", teamId)
            .single();

        if (error) throw error;

        // Sort subtasks and comments
        if (task.subtasks) {
            task.subtasks.sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        }
        if (task.comments) {
            task.comments.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }

        return task;
    } catch (error) {
        console.error("Error fetching task hierarchy:", error);
        return null;
    }
}
