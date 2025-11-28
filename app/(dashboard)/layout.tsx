import type { Metadata } from "next";
import { Header } from "@/components/dashboard/header";
import { TaskUrlHandler } from "@/components/tasks/task-url-handler";

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

    // Get team details and role
    const { data: membershipData } = await supabase
        .from("team_members")
        .select("team_id, role, team:teams(name)")
        .eq("user_id", user.id)
        .maybeSingle();

    if (!membershipData) {
        redirect("/onboarding/create-team");
    }

    const membership = membershipData as { team_id: string; role: string; team: { name: string } };
    const teamName = membership.team?.name || 'Team';

    // Fetch members for TaskDialog in Header
    const { getTeamMembers, getTeamSettings } = await import("@/actions/teams");
    const members = await getTeamMembers(membership.team_id);
    const settings = await getTeamSettings();

    // Prioritize user_metadata.name (or full_name) over email
    const userName = user?.user_metadata.name || user?.user_metadata.full_name || user?.email || 'ゲスト';

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <Header
                user={user}
                userName={userName}
                teamName={teamName}
                members={members}
                settings={settings}
            />
            <main className="flex-1 relative">
                <TaskUrlHandler />
                {children}
            </main>
        </div>
    );
}
