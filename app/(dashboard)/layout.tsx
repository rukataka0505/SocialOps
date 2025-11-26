import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard | SocialOps",
    description: "SocialOps Dashboard",
};

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Dashboard Layout
 * Shared layout for all dashboard pages (sidebar, header, etc.)
 */
export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Check if user belongs to any team
    const { data: membership } = await supabase
        .from("team_members")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (!membership) {
        redirect("/onboarding/create-team");
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* TODO: Add Sidebar */}
            {/* TODO: Add Header */}
            <main className="p-8">{children}</main>
        </div>
    );
}
