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
                    name,
                    spreadsheet_url
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

        const { error } = await (supabase as any)
            .from("tasks")
            .update({ status, completed_at })
            .eq("id", taskId);

        if (error) throw error;

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
                routine_id: null,
                status,
                created_by: user.id,
                source_type: 'manual',
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
                    name,
                    spreadsheet_url
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

        // Debug: Log before UUID processing
        console.log('updateData before UUID processing:', JSON.stringify(updateData, null, 2));

        // Handle all UUID fields - convert empty strings to null to avoid UUID errors
        const uuidFields = ['client_id', 'project_id', 'routine_id', 'assigned_to', 'parent_id'];
        uuidFields.forEach(field => {
            if (updateData[field] === "" || updateData[field] === "undefined") {
                updateData[field] = null;
            }
        });

        // Also check attributes object for UUID fields
        if (updateData.attributes && typeof updateData.attributes === 'object') {
            Object.keys(updateData.attributes).forEach(key => {
                const value = updateData.attributes[key];
                if (value === "" || value === "undefined" || value === null) {
                    delete updateData.attributes[key];
                }
            });
        }

        // Debug: Log after UUID processing
        console.log('updateData after UUID processing:', JSON.stringify(updateData, null, 2));

        const finalUpdatePayload = {
            ...updateData,
            updated_at: new Date().toISOString(),
        };

        // Debug: Log the final payload being sent to Supabase
        console.log('Final payload to Supabase:', JSON.stringify(finalUpdatePayload, null, 2));

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
                client:clients(id, name, spreadsheet_url),
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

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error submitting deliverable:", error);
        return { success: false, error };
    }
}
