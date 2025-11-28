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
        const notes = formData.get("notes") as string;
        const credentialsJson = formData.get("credentials") as string;
        const resourcesJson = formData.get("resources") as string;
        const fieldsJson = formData.get("_fields") as string;

        let credentials = [];
        let resources = [];
        let attributes: Record<string, any> = {};

        try {
            if (credentialsJson) credentials = JSON.parse(credentialsJson);
            if (resourcesJson) resources = JSON.parse(resourcesJson);

            // Extract custom fields based on definition
            if (fieldsJson) {
                const fields = JSON.parse(fieldsJson);
                fields.forEach((field: any) => {
                    if (!field.system) {
                        const value = formData.get(field.id);
                        if (value !== null) {
                            attributes[field.id] = value;
                        }
                    }
                });
                // Save field definitions snapshot
                attributes['_fields'] = fields;
            }
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
            notes: notes || null,
            credentials,
            resources,
            attributes
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
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const notes = formData.get("notes") as string;
        const credentialsJson = formData.get("credentials") as string;
        const resourcesJson = formData.get("resources") as string;
        const fieldsJson = formData.get("_fields") as string;

        let credentials;
        let resources;
        let attributes: Record<string, any> = {};

        try {
            if (credentialsJson) credentials = JSON.parse(credentialsJson);
            if (resourcesJson) resources = JSON.parse(resourcesJson);

            // Extract custom fields based on definition
            if (fieldsJson) {
                const fields = JSON.parse(fieldsJson);
                fields.forEach((field: any) => {
                    if (!field.system) {
                        const value = formData.get(field.id);
                        if (value !== null) {
                            attributes[field.id] = value;
                        }
                    }
                });
                // Save field definitions snapshot
                attributes['_fields'] = fields;
            }
        } catch (e) {
            console.error("Failed to parse client JSON fields", e);
        }

        if (!name) {
            return { error: "Case name is required" };
        }

        // Fetch existing attributes to merge if needed, but for now we overwrite custom fields
        // Ideally we should merge with existing if we want to keep fields not in current form (e.g. hidden ones)
        // But here we assume form has all active fields.
        // Let's just update what we have.

        const updateData: any = {
            name,
            email: email || null,
            phone: phone || null,
            notes: notes || null,
            updated_at: new Date().toISOString(),
        };

        if (credentials !== undefined) updateData.credentials = credentials;
        if (resources !== undefined) updateData.resources = resources;

        // We need to be careful not to wipe existing attributes if we only send partial updates?
        // But formData usually contains all fields in the form.
        // For simplicity, we'll fetch existing client to merge attributes if we want to be safe,
        // or just overwrite if we trust the form.
        // Let's fetch to be safe and merge.

        const { data: existing } = await (supabase as any).from("clients").select("attributes").eq("id", clientId).single();
        if (existing) {
            updateData.attributes = { ...existing.attributes, ...attributes };
        } else {
            updateData.attributes = attributes;
        }

        const { error } = await (supabase as any)
            .from("clients")
            .update(updateData)
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
