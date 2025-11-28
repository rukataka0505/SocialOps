"use server";

import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database.types";
import { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

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

/**
 * Identify subscribers for a task (assignees + commenters)
 */
export async function getTaskSubscribers(taskId: string, excludeUserId?: string): Promise<string[]> {
    const supabase = await createClient();

    try {
        // 1. Get assignees of the task (and potentially subtasks if we want to be broad, but spec says "parent task's subtasks assignees" for parent task updates? 
        // Let's stick to the spec: "Target: 1. Child task assignees linked to that parent task, 2. Past commenters"

        // Fetch task to check if it's a parent or child
        const { data: task } = await (supabase as any)
            .from("tasks")
            .select("id, parent_id")
            .eq("id", taskId)
            .single();

        if (!task) return [];

        const parentId = task.parent_id || task.id;

        // 1. Get all assignees of the parent task AND its subtasks
        // We can fetch all tasks with this parent_id (including the parent itself if we query by ID or ParentID)
        // Actually, let's just fetch all assignments for tasks in this "family"

        // Find all task IDs in this family (parent + children)
        const { data: familyTasks } = await (supabase as any)
            .from("tasks")
            .select("id")
            .or(`id.eq.${parentId},parent_id.eq.${parentId}`);

        const familyTaskIds = familyTasks?.map((t: any) => t.id) || [];

        if (familyTaskIds.length === 0) return [];

        const { data: assignments } = await (supabase as any)
            .from("task_assignments")
            .select("user_id")
            .in("task_id", familyTaskIds);

        // 2. Get all commenters on these tasks
        const { data: comments } = await (supabase as any)
            .from("task_comments")
            .select("user_id")
            .in("task_id", familyTaskIds);

        const subscriberSet = new Set<string>();

        assignments?.forEach((a: any) => subscriberSet.add(a.user_id));
        comments?.forEach((c: any) => subscriberSet.add(c.user_id));

        if (excludeUserId) {
            subscriberSet.delete(excludeUserId);
        }

        return Array.from(subscriberSet);
    } catch (error) {
        console.error("Error getting task subscribers:", error);
        return [];
    }
}

/**
 * Create notifications for multiple users
 */
export async function createNotification(
    userIds: string[],
    type: string,
    title: string,
    content: string,
    resource_url?: string,
    actor_id?: string
) {
    if (userIds.length === 0) return { success: true };

    const supabase = await createClient();

    try {
        const teamId = await getTeamId(supabase);

        const notifications = userIds.map(userId => ({
            user_id: userId,
            team_id: teamId,
            type,
            title,
            message: content,
            read: false,
            metadata: {
                resource_url,
                actor_id
            }
        }));

        const { error } = await (supabase as any)
            .from("notifications")
            .insert(notifications);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error("Error creating notifications:", error);
        return { success: false, error };
    }
}

/**
 * Get unread notifications for the current user
 */
export async function getNotifications(limit = 20) {
    const supabase = await createClient();

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return [];

        const { data: notifications, error } = await (supabase as any)
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .eq("read", false)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) throw error;

        return notifications || [];
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string) {
    const supabase = await createClient();

    try {
        const { error } = await (supabase as any)
            .from("notifications")
            .update({ read: true })
            .eq("id", notificationId);

        if (error) throw error;

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return { success: false, error };
    }
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllAsRead() {
    const supabase = await createClient();

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("Unauthorized");

        const { error } = await (supabase as any)
            .from("notifications")
            .update({ read: true })
            .eq("user_id", user.id)
            .eq("read", false);

        if (error) throw error;

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return { success: false, error };
    }
}
