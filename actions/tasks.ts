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

// Placeholder for other actions
export async function createTask() {
    // Implementation pending
}

export async function updateTask() {
    // Implementation pending
}

export async function deleteTask() {
    // Implementation pending
}
