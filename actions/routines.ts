/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { generateTasksForRoutine } from "@/lib/logic/generator";
import { nextSunday } from "date-fns";

export type RoutineState = {
    error?: string;
    success?: boolean;
    message?: string;
};

async function getTeamId(supabase: SupabaseClient<Database>) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { data: teamMember, error: teamError } = await (supabase as any)
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .single();

    if (teamError || !teamMember) throw new Error("No team found for user");
    return { teamId: teamMember.team_id, userId: user.id };
}

export async function getRoutines(clientId: string) {
    const supabase = await createSupabaseClient();

    try {
        const { data: routines, error } = await (supabase as any)
            .from("routines")
            .select("*")
            .eq("client_id", clientId)
            .is("deleted_at", null)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return routines;
    } catch (error) {
        console.error("Error fetching routines:", error);
        return [];
    }
}

export async function createRoutine(clientId: string, prevState: RoutineState | null, formData: FormData): Promise<RoutineState> {
    const supabase = await createSupabaseClient();

    try {
        const { teamId, userId } = await getTeamId(supabase);

        const title = formData.get("title") as string;
        const time = formData.get("time") as string;
        const days = formData.getAll("days") as string[];
        const defaultAssigneeId = formData.get("default_assignee_id") as string;

        if (!title) return { error: "Routine name is required" };
        if (!time) return { error: "Time is required" };
        if (!days || days.length === 0) return { error: "At least one day must be selected" };

        const frequency = {
            days: days,
            time: time
        };

        const { data: routine, error } = await (supabase as any)
            .from("routines")
            .insert({
                team_id: teamId,
                client_id: clientId,
                title,
                frequency,
                start_date: new Date().toISOString(), // Default to now
                default_assignee_id: defaultAssigneeId || null,
            })
            .select()
            .single();

        if (error) throw error;

        // Generate tasks for the new routine
        const rangeStart = new Date();
        const rangeEnd = nextSunday(rangeStart);
        const tasks = generateTasksForRoutine(routine, rangeStart, rangeEnd, userId);

        if (tasks.length > 0) {
            const { error: tasksError } = await (supabase as any)
                .from("tasks")
                .insert(tasks, { ignoreDuplicates: true });

            if (tasksError) {
                console.error("Error generating tasks:", tasksError);
                // We don't throw here to avoid failing the routine creation if task generation fails
            }
        }

        revalidatePath(`/clients/${clientId}`);
        return { success: true, message: "Routine created successfully" };
    } catch (error: any) {
        return { error: error.message || "Failed to create routine" };
    }
}

export async function deleteRoutine(routineId: string, clientId: string): Promise<RoutineState> {
    const supabase = await createSupabaseClient();

    try {
        const { error } = await (supabase as any)
            .from("routines")
            .update({
                deleted_at: new Date().toISOString(),
            })
            .eq("id", routineId);

        if (error) throw error;

        revalidatePath(`/clients/${clientId}`);
        return { success: true, message: "Routine deleted successfully" };
    } catch (error: any) {
        return { error: error.message || "Failed to delete routine" };
    }
}
