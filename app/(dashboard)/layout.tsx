import type { Metadata } from "next";
import { Header } from "@/components/dashboard/header";
import { TaskUrlHandler } from "@/components/tasks/task-url-handler";

export const metadata: Metadata = {
    title: "Dashboard | SocialOps",
    description: "SocialOps Dashboard",
};

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import { getCurrentTeamId } from "@/lib/team-utils";
import { TeamCookieSyncer } from "@/components/dashboard/team-cookie-syncer";

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

    // Get current team ID
    const currentTeamId = await getCurrentTeamId(supabase);

    if (!currentTeamId) {
        redirect("/onboarding/create-team");
    }

    // Fetch all teams for the user (for switcher)
    const { data: teamMembers } = await supabase
        .from("team_members")
        .select("team:teams(id, name)")
        .eq("user_id", user.id);

    const teams = teamMembers?.map((tm: any) => tm.team) || [];
    const currentTeam = teams.find((t: any) => t.id === currentTeamId);
    const teamName = currentTeam?.name || 'Team';

    // Fetch members for TaskDialog in Header
    const { getTeamMembers, getTeamSettings } = await import("@/actions/teams");
    const members = await getTeamMembers(currentTeamId);
    const settings = await getTeamSettings();

    // Prioritize user_metadata.name (or full_name) over email
    const userName = user?.user_metadata.name || user?.user_metadata.full_name || user?.email || 'ゲスト';

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <Header
                user={user}
                userName={userName}
                teamName={teamName}
                currentTeamId={currentTeamId}
                teams={teams}
                members={members}
                settings={settings}
            />
            <main className="flex-1 overflow-y-auto bg-slate-50">
                <div className="w-full max-w-[1440px] mx-auto p-4 md:p-6">
                    <TaskUrlHandler />
                    <TeamCookieSyncer teamId={currentTeamId} />
                    {children}
                </div>
            </main>
        </div>
    );
}
