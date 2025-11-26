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
        // Status != 'completed' (and 'cancelled'?)
        // Requirement says: status != 'done' (mapped to 'completed').
        // Also due_date <= todayStr.
        const { data: tasks, error } = await (supabase as any)
            .from("tasks")
            .select("*")
            .eq("team_id", teamId)
            .neq("status", "completed")
            .lte("due_date", todayStr)
            .order("due_date", { ascending: true });

        if (error) throw error;

        // Custom sort for priority
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

        const sortedTasks = tasks?.sort((a: any, b: any) => {
            // Primary sort: due_date (already sorted by DB, but let's preserve/ensure)
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
        const assigned_to = formData.get("assigned_to") as string;

        if (!title || !due_date) {
            return { success: false, error: "タイトルと期限は必須です" };
        }

        // Insert task with routine_id as NULL
        const { error } = await (supabase as any)
            .from("tasks")
            .insert({
                team_id: teamId,
                title,
                due_date,
                priority,
                assigned_to: assigned_to || null,
                routine_id: null,
                status: "pending",
                created_by: user.id,
            });

        if (error) throw error;

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

        // Fetch tasks with assignee details
        // We assume assigned_to references public.users.id
        const { data: tasks, error } = await (supabase as any)
            .from("tasks")
            .select(`
                *,
                assignee:users!assigned_to (
                    id,
                    name,
                    avatar_url
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

        // Remove undefined fields
        const updateData = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
        );

        const { error } = await (supabase as any)
            .from("tasks")
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
            })
            .eq("id", taskId)
            .eq("team_id", teamId);

        if (error) throw error;

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
