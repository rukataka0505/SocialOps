"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type StaffMember = {
    id: string;
    role_name: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        avatar_url: string | null;
    };
};

export async function getStaff(clientId: string): Promise<StaffMember[]> {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: staff, error } = await (supabase as any)
        .from("client_staff")
        .select(`
            id,
            role_name,
            user:users (
                id,
                name,
                email,
                avatar_url
            )
        `)
        .eq("client_id", clientId);

    if (error) {
        console.error("Error fetching staff:", error);
        return [];
    }

    return staff as StaffMember[];
}

export async function assignStaff(clientId: string, userId: string, roleName: string) {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
        .from("client_staff")
        .insert({
            client_id: clientId,
            user_id: userId,
            role_name: roleName,
        });

    if (error) {
        console.error("Error assigning staff:", error);
        throw new Error("Failed to assign staff");
    }

    revalidatePath(`/clients/${clientId}`);
}

export async function updateStaffRole(staffId: string, newRoleName: string) {
    const supabase = await createClient();

    // Fetch client_id first for revalidation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: staff } = await (supabase as any)
        .from("client_staff")
        .select("client_id")
        .eq("id", staffId)
        .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
        .from("client_staff")
        .update({ role_name: newRoleName })
        .eq("id", staffId);

    if (error) {
        console.error("Error updating staff role:", error);
        throw new Error("Failed to update staff role");
    }

    if (staff) {
        revalidatePath(`/clients/${staff.client_id}`);
    }
}

export async function removeStaff(staffId: string) {
    const supabase = await createClient();

    // Fetch client_id first for revalidation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: staff } = await (supabase as any)
        .from("client_staff")
        .select("client_id")
        .eq("id", staffId)
        .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
        .from("client_staff")
        .delete()
        .eq("id", staffId);

    if (error) {
        console.error("Error removing staff:", error);
        throw new Error("Failed to remove staff");
    }

    if (staff) {
        revalidatePath(`/clients/${staff.client_id}`);
    }
}
