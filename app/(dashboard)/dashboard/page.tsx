import { getTasks, getMemberTasks } from "@/actions/tasks";
import { getTeamMembers, getTeamSettings } from "@/actions/teams";
import { CalendarBoard } from "@/components/dashboard/calendar-board";
import { TeamPanel } from "@/components/dashboard/team-panel";
import { MyTasks } from "@/components/dashboard/my-tasks";
import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get current team ID
    const { getCurrentTeamId } = await import("@/lib/team-utils");
    const teamId = await getCurrentTeamId(supabase);

    if (!teamId) {
        redirect("/onboarding/create-team");
    }

    // Get team details and role for the current team
    const { data: teamMember } = await supabase
        .from("team_members")
        .select("team_id, role, team:teams(name)")
        .eq("user_id", user.id)
        .eq("team_id", teamId)
        .single();

    const currentUserRole = teamMember?.role || undefined;
    const teamName = teamMember?.team?.name || 'Team';

    // Fetch tasks for the current month (for Calendar)
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    // Parallelize data fetching
    const [members, settings, tasks, myTasks] = await Promise.all([
        getTeamMembers(teamId),
        getTeamSettings(),
        getTasks(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')),
        getMemberTasks(user.id)
    ]);

    // Prioritize user_metadata.name (or full_name) over email
    // This fixes the issue where guests see their dummy email
    const userName = user?.user_metadata.name || user?.user_metadata.full_name || user?.email || 'ユーザー';

    return (
        <div className="flex flex-col min-h-full bg-slate-50 pb-10">

            {/* Main Content */}
            <div className="flex flex-1 flex-col lg:flex-row w-full">
                {/* Left Column: My Tasks + Calendar */}
                <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
                    {/* Top: My Tasks */}
                    <section className="px-6 py-4 border-b border-slate-100 bg-white/50">
                        <MyTasks tasks={myTasks} members={members} currentUserId={user.id} settings={settings} />
                    </section>

                    {/* Center: Calendar */}
                    <section className="flex-1 p-6 min-h-[800px]">
                        <CalendarBoard tasks={tasks} members={members} currentUserId={user.id} settings={settings} />
                    </section>
                </main>

                {/* Right: Team Panel */}
                <TeamPanel members={members} currentUserRole={currentUserRole} />
            </div>
        </div>
    );
}
