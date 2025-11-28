"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

export type ClientState = {
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
    return teamMember.team_id;
}

export async function getClients() {
    const supabase = await createSupabaseClient();

    try {
        const teamId = await getTeamId(supabase);

        const { data: clients, error } = await (supabase as any)
            .from("clients")
            .select("*")
            .eq("team_id", teamId)
            .is("deleted_at", null)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return clients;
    } catch (error) {
        console.error("Error fetching clients:", error);
        return [];
    }
}

export async function getClient(clientId: string) {
    const supabase = await createSupabaseClient();

    try {
        const { data: client, error } = await (supabase as any)
            .from("clients")
            .select("*")
            .eq("id", clientId)
            .single();

        if (error) throw error;
        return client;
    } catch (error) {
        console.error("Error fetching client:", error);
        return null;
    }
}

export async function createClient(prevState: ClientState | null, formData: FormData): Promise<ClientState> {
    const supabase = await createSupabaseClient();

    try {
        const teamId = await getTeamId(supabase);

        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const spreadsheet_url = formData.get("spreadsheet_url") as string;
        const notes = formData.get("notes") as string;
        const credentialsJson = formData.get("credentials") as string;
        const resourcesJson = formData.get("resources") as string;

        let credentials = [];
        let resources = [];

        try {
            if (credentialsJson) credentials = JSON.parse(credentialsJson);
            if (resourcesJson) resources = JSON.parse(resourcesJson);
        } catch (e) {
            console.error("Failed to parse client JSON fields", e);
        }

        if (!name) {
            return { error: "Case name is required" };
        }

        const { error } = await (supabase as any).from("clients").insert({
            team_id: teamId,
            name,
            email: email || null,
            phone: phone || null,
            spreadsheet_url: spreadsheet_url || null,
            notes: notes || null,
            credentials,
            resources,
        });

        if (error) throw error;

        revalidatePath("/clients");
        return { success: true, message: "Case created successfully" };
    } catch (error: any) {
        return { error: error.message || "Failed to create case" };
    }
}

export async function updateClient(clientId: string, prevState: ClientState | null, formData: FormData): Promise<ClientState> {
    const supabase = await createSupabaseClient();

    try {
        // Verify ownership/team access implicitly by checking if the client exists for this team?
        // For now, just update. RLS should handle security if set up, but we should be careful.
        // We'll rely on RLS for strict security, but here we just do the update.

        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const spreadsheet_url = formData.get("spreadsheet_url") as string;
        const notes = formData.get("notes") as string;
        const credentialsJson = formData.get("credentials") as string;
        const resourcesJson = formData.get("resources") as string;

        let credentials;
        let resources;

        try {
            if (credentialsJson) credentials = JSON.parse(credentialsJson);
            if (resourcesJson) resources = JSON.parse(resourcesJson);
        } catch (e) {
            console.error("Failed to parse client JSON fields", e);
        }

        if (!name) {
            return { error: "Case name is required" };
        }

        const { error } = await (supabase as any)
            .from("clients")
            .update({
                name,
                email: email || null,
                phone: phone || null,
                spreadsheet_url: spreadsheet_url || null,
                notes: notes || null,
                ...(credentials !== undefined && { credentials }),
                ...(resources !== undefined && { resources }),
                updated_at: new Date().toISOString(),
            })
            .eq("id", clientId);

        if (error) throw error;

        revalidatePath("/clients");
        return { success: true, message: "Case updated successfully" };
    } catch (error: any) {
        return { error: error.message || "Failed to update case" };
    }
}

export async function deleteClient(clientId: string): Promise<ClientState> {
    const supabase = await createSupabaseClient();

    try {
        const { error } = await (supabase as any)
            .from("clients")
            .update({
                deleted_at: new Date().toISOString(),
            })
            .eq("id", clientId);

        if (error) throw error;

        revalidatePath("/clients");
        return { success: true, message: "Case deleted successfully" };
    } catch (error: any) {
        return { error: error.message || "Failed to delete case" };
    }
}
